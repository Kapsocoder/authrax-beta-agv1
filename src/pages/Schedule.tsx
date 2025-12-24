import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  setHours,
  setMinutes
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";

export default function Schedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { posts, createPost, updatePost } = usePosts();
  const { checkUsageLimit, incrementUsage, usageCount, checkFeatureAccess } = useProfile();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [editingContent, setEditingContent] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Content passed from Create page
  const contentToSchedule = location.state?.content as string | undefined;
  const existingPostId = location.state?.postId as string | undefined;

  // Get scheduled posts grouped by date
  const scheduledPostsByDate = useMemo(() => {
    const grouped: Record<string, typeof posts> = {};
    posts.forEach(post => {
      if (post.scheduled_for) {
        const dateKey = format(parseISO(post.scheduled_for), "yyyy-MM-dd");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(post);
      }
    });
    return grouped;
  }, [posts]);

  // Get posts for selected date
  const selectedDatePosts = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return scheduledPostsByDate[dateKey] || [];
  }, [selectedDate, scheduledPostsByDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad days to start from correct weekday
  const startDay = monthStart.getDay();
  const paddedDays = [...Array(startDay).fill(null), ...days];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);

    // If we have content to schedule and clicked a date, open schedule dialog
    if (contentToSchedule) {
      setEditingContent(contentToSchedule);
      setShowScheduleDialog(true);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedDate || !editingContent.trim()) {
      toast.error("Please select a date and enter content");
      return;
    }

    // Check Feature Access First
    if (!checkFeatureAccess('schedule')) {
      setShowSubscriptionModal(true);
      return;
    }

    if (!checkUsageLimit()) {
      setShowSubscriptionModal(true);
      return;
    }

    const [hours, minutes] = scheduleTime.split(":").map(Number);
    const scheduledFor = setMinutes(setHours(selectedDate, hours), minutes);

    try {
      if (existingPostId) {
        // Update existing draft to scheduled status
        await updatePost.mutateAsync({
          id: existingPostId,
          status: "scheduled",
          scheduled_for: scheduledFor.toISOString(),
          content: editingContent, // Ensure content is up to date
        });
      } else {
        // Create new scheduled post
        await createPost.mutateAsync({
          content: editingContent,
          status: "scheduled",
          scheduled_for: scheduledFor.toISOString(),
        });
      }

      setShowScheduleDialog(false);
      setEditingContent("");
      // Clear the location state
      window.history.replaceState({}, document.title);
      toast.success(`Post scheduled for ${format(scheduledFor, "MMM d 'at' h:mm a")}`);
      incrementUsage.mutate();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleUnschedule = async (postId: string) => {
    await updatePost.mutateAsync({
      id: postId,
      status: "draft",
      scheduled_for: null,
    });
    toast.success("Post moved to drafts");
  };

  const bestTimes = [
    { time: "8:00 AM", engagement: "High" },
    { time: "12:00 PM", engagement: "Medium" },
    { time: "5:30 PM", engagement: "High" },
  ];

  return (
    <AppLayout onLogout={signOut}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Schedule</h1>
            <p className="text-muted-foreground">Plan and schedule your LinkedIn posts</p>
          </div>
          <Button variant="gradient" onClick={() => navigate("/create")}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>

        {/* Content to schedule banner */}
        {contentToSchedule && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">Ready to schedule</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{contentToSchedule}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => window.history.replaceState({}, document.title)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-primary mt-2">Click on a date to schedule this post</p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Calendar */}
          <Card className="md:col-span-2 bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  {format(currentMonth, "MMMM yyyy")}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week days header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {paddedDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dateKey = format(day, "yyyy-MM-dd");
                  const postCount = scheduledPostsByDate[dateKey]?.length || 0;
                  const isSelected = selectedDate && isSameDay(selectedDate, day);

                  return (
                    <button
                      key={dateKey}
                      onClick={() => handleDateClick(day)}
                      className={`
                        aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative
                        ${isToday(day) ? "bg-primary text-primary-foreground font-bold" : ""}
                        ${isSelected && !isToday(day) ? "bg-secondary ring-2 ring-primary" : ""}
                        ${!isToday(day) && !isSelected ? "hover:bg-secondary/50" : ""}
                        ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/50" : "text-foreground"}
                      `}
                    >
                      <span>{format(day, "d")}</span>
                      {postCount > 0 && (
                        <div className="absolute bottom-1 flex gap-0.5">
                          {[...Array(Math.min(postCount, 3))].map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {selectedDate ? format(selectedDate, "MMM d") : "Select a date"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDatePosts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDatePosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-3 rounded-lg bg-secondary/50 border border-border"
                      >
                        <p className="text-sm text-foreground line-clamp-2 mb-2">
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {post.scheduled_for && format(parseISO(post.scheduled_for), "h:mm a")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-xs">No posts scheduled for this date</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Best times to post</CardTitle>
                <CardDescription className="text-xs">
                  Based on your timezone and audience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bestTimes.map((item) => (
                    <div key={item.time} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${item.engagement === "High" ? "bg-success" : "bg-warning"}`} />
                        {item.time}
                      </div>
                      <span className="text-xs text-muted-foreground">{item.engagement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Scheduled Posts List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Scheduled Posts</CardTitle>
            <CardDescription>
              {selectedDate
                ? `Showing posts for ${format(selectedDate, "MMMM d, yyyy")}`
                : "All upcoming scheduled posts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {posts.filter(p => p.status === 'scheduled').length > 0 ? (
              <div className="space-y-2">
                {posts
                  .filter(post => post.status === 'scheduled')
                  .filter(post => {
                    if (!selectedDate || !post.scheduled_for) return true;
                    return isSameDay(parseISO(post.scheduled_for), selectedDate);
                  })
                  .sort((a, b) => {
                    if (!a.scheduled_for || !b.scheduled_for) return 0;
                    return new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime();
                  })
                  .map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10">
                            {post.scheduled_for && format(parseISO(post.scheduled_for), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground line-clamp-1">{post.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnschedule(post.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Unschedule
                      </Button>
                    </div>
                  ))}
                {posts.filter(post => post.status === 'scheduled' && selectedDate && post.scheduled_for && isSameDay(parseISO(post.scheduled_for), selectedDate)).length === 0 && selectedDate && (
                  <div className="text-center py-8 text-muted-foreground">
                    No posts scheduled for this specific date.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No upcoming posts scheduled</p>
                <Button
                  variant="link"
                  onClick={() => navigate('/create')}
                  className="mt-2"
                >
                  Schedule your first post
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Post Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Schedule Post
            </DialogTitle>
            <DialogDescription>
              {selectedDate && `Scheduling for ${format(selectedDate, "EEEE, MMMM d, yyyy")}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="post-content">Content</Label>
              <Textarea
                id="post-content"
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                placeholder="Write your post content..."
                className="mt-2 min-h-[150px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleSchedulePost}
              disabled={createPost.isPending || !editingContent.trim()}
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SubscriptionModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
        currentUsage={usageCount}
      />
    </AppLayout>
  );
}
