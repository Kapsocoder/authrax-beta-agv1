
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileText,
    Search,
    Filter,
    ArrowUpDown,
    ExternalLink,
    Calendar,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePosts, Post } from "@/hooks/usePosts";
import { format, parseISO, subDays, isAfter } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type DateFilter = "week" | "month" | "all";
type SortOrder = "desc" | "asc";

export default function Published() {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { posts, isLoading } = usePosts();

    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState<DateFilter>("week");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    const filteredPosts = useMemo(() => {
        if (!posts) return [];

        let result = posts.filter(post => post.status === "published");

        // 1. Text Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(post =>
                (post.content || "").toLowerCase().includes(query) ||
                (post.input_context || "").toLowerCase().includes(query)
            );
        }

        // 2. Date Filter
        const now = new Date();
        if (dateFilter === "week") {
            const weekAgo = subDays(now, 7);
            result = result.filter(post => {
                const date = post.published_at ? parseISO(post.published_at) : new Date(post.updated_at);
                return isAfter(date, weekAgo);
            });
        } else if (dateFilter === "month") {
            const monthAgo = subDays(now, 30);
            result = result.filter(post => {
                const date = post.published_at ? parseISO(post.published_at) : new Date(post.updated_at);
                return isAfter(date, monthAgo);
            });
        }

        // 3. Sorting
        result.sort((a, b) => {
            const dateA = a.published_at ? new Date(a.published_at).getTime() : new Date(a.updated_at).getTime();
            const dateB = b.published_at ? new Date(b.published_at).getTime() : new Date(b.updated_at).getTime();
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [posts, searchQuery, dateFilter, sortOrder]);

    const handlePostClick = (post: Post) => {
        setSelectedPost(post);
    };

    const getLinkedInUrl = (post: Post) => {
        // If we have a direct ID, use it. Otherwise fallback to generic feed.
        if (post.linkedin_id) {
            // Check if it's a full URN or just ID
            const id = post.linkedin_id.includes(':') ? post.linkedin_id.split(':').pop() : post.linkedin_id;
            return `https://www.linkedin.com/feed/update/urn:li:share:${id}/`; // or activity
        }
        return "https://www.linkedin.com/feed/";
    };

    return (
        <AppLayout onLogout={signOut}>
            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-primary" />
                            Published Posts
                        </h1>
                        <p className="text-muted-foreground">
                            Your history of published content
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="bg-secondary/50 p-1 rounded-lg border border-border flex items-center text-sm text-muted-foreground px-3">
                            {filteredPosts.length} posts found
                        </div>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-0 z-10 bg-background/95 backdrop-blur-sm p-4 -mx-4 md:mx-0 md:p-0 md:bg-transparent border-b md:border-0 border-border">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search history..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                            <SelectTrigger className="w-[140px]">
                                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                            <SelectTrigger className="w-[160px]">
                                <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="desc">Newest First</SelectItem>
                                <SelectItem value="asc">Oldest First</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Content Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="bg-card border-border animate-pulse h-48" />
                        ))}
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <Card className="bg-card border-border">
                        <CardContent className="p-12 text-center">
                            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No posts found</h3>
                            <p className="text-muted-foreground">
                                Try adjusting your filters or search query
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPosts.map((post) => (
                            <Card
                                key={post.id}
                                className="bg-card border-border hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group"
                                onClick={() => handlePostClick(post)}
                            >
                                <CardContent className="p-5 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-3">
                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                                            Published
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {post.published_at ? format(parseISO(post.published_at), 'MMM d, yyyy') : 'Recently'}
                                        </span>
                                    </div>

                                    <p className="text-sm text-foreground line-clamp-4 flex-1 mb-4 break-words">
                                        {post.content}
                                    </p>

                                    <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Eye className="w-3 h-3" /> View details
                                        </span>
                                        {post.media_urls && post.media_urls.length > 0 && (
                                            <Badge variant="secondary" className="text-[10px]">
                                                {post.media_urls.length} Image{post.media_urls.length > 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Read-Only Detail Dialog */}
            <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Post Details
                            <Badge variant="outline" className="ml-2 font-normal">
                                {selectedPost?.published_at ? format(parseISO(selectedPost.published_at), 'PPP p') : ''}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPost && (
                        <div className="space-y-6">
                            {/* Content */}
                            <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                                <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed text-foreground">
                                    {selectedPost.content}
                                </p>
                            </div>

                            {/* Media Gallery */}
                            {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">Attached Media</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedPost.media_urls.map((url, i) => (
                                            <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border bg-black/5">
                                                <img src={url} alt={`Attachment ${i + 1}`} className="object-cover w-full h-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 justify-end pt-2">
                                <Button variant="outline" onClick={() => setSelectedPost(null)}>
                                    Close
                                </Button>
                                <Button
                                    variant="default"
                                    className="bg-[#0077b5] hover:bg-[#006097] text-white"
                                    onClick={() => window.open(getLinkedInUrl(selectedPost), '_blank')}
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View on LinkedIn
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
