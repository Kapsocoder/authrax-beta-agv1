import { ThumbsUp, MessageCircle, Repeat2, Send } from "lucide-react";

interface LinkedInPreviewProps {
  content: string;
  authorName?: string;
  authorTitle?: string;
  authorAvatar?: string;
}

export function LinkedInPreview({ 
  content, 
  authorName = "Your Name",
  authorTitle = "Your Professional Title",
  authorAvatar,
}: LinkedInPreviewProps) {
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => (
        <span key={i}>
          {line}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      ));
  };

  const previewContent = content || "Start writing your post to see the preview...";
  const isPlaceholder = !content;

  return (
    <div className="linkedin-preview bg-[#1B1F23] rounded-xl border border-[#38434F] overflow-hidden max-w-md mx-auto">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-lg shrink-0">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="w-full h-full rounded-full object-cover" />
          ) : (
            authorName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[#E7E9EA] text-sm">{authorName}</h4>
          <p className="text-xs text-[#71767B] truncate">{authorTitle}</p>
          <p className="text-xs text-[#71767B]">Just now · 🌐</p>
        </div>
      </div>

      {/* Content */}
      <div className={`px-4 pb-4 ${isPlaceholder ? 'text-[#71767B] italic' : 'text-[#E7E9EA]'}`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {formatContent(previewContent)}
        </p>
      </div>

      {/* Engagement Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-[#71767B] border-t border-[#38434F]">
        <div className="flex items-center gap-1">
          <span className="flex -space-x-1">
            <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px]">👍</span>
            <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[8px]">❤️</span>
          </span>
          <span>0</span>
        </div>
        <span>0 comments · 0 reposts</span>
      </div>

      {/* Action Buttons */}
      <div className="px-2 py-1 flex items-center justify-around border-t border-[#38434F]">
        {[
          { icon: ThumbsUp, label: "Like" },
          { icon: MessageCircle, label: "Comment" },
          { icon: Repeat2, label: "Repost" },
          { icon: Send, label: "Send" },
        ].map((action) => (
          <button
            key={action.label}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[#71767B] hover:bg-[#38434F]/50 transition-colors"
          >
            <action.icon className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
