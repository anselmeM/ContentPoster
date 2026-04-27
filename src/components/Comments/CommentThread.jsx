import { useState, useEffect, useRef } from 'react';
import { useTeam } from '../../context/TeamContext';
import clsx from 'clsx';

const CommentItem = ({ comment, currentUserId, onDelete, canDelete }) => {
  const isOwn = comment.userId === currentUserId;
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div className={clsx('group flex gap-3 p-3 rounded-lg', isOwn ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700')}>
      {/* Avatar */}
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isOwn ? 'bg-indigo-600 text-white' : 'bg-gray-400 text-white'
      )}>
        <span className="text-sm font-medium">
          {comment.userId?.charAt(0).toUpperCase() || '?'}
        </span>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={clsx('text-sm font-medium', isOwn ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white')}>
            {comment.userId}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Just now'}
          </span>
        </div>
        
        <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
          {comment.text}
        </p>
      </div>
      
      {/* Actions */}
      {isOwn && canDelete && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Comment actions"
            aria-expanded={showMenu}
          >
            <i className="fas fa-ellipsis-h" aria-hidden="true" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { onDelete(comment.id); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <i className="fas fa-trash mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CommentInput = ({ onSubmit, placeholder = 'Add a comment...' }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    await onSubmit(text.trim());
    setText('');
    setIsSubmitting(false);
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
      />
      <button
        type="submit"
        disabled={!text.trim() || isSubmitting}
        className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <i className="fas fa-spinner fa-spin" />
        ) : (
          'Send'
        )}
      </button>
    </form>
  );
};

const CommentThread = ({ postId, canComment = true }) => {
  const { user, addComment, deleteComment, currentWorkspace } = useTeam();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const unsubscribeRef = useRef(null);
  
  // Subscribe to comments
  useEffect(() => {
    if (!currentWorkspace || !postId) return;
    
    // Import the service dynamically to avoid circular deps
    import('../../services/firebase').then(({ teamService }) => {
      unsubscribeRef.current = teamService.subscribeToPostComments(
        currentWorkspace.id,
        postId,
        (commentList) => {
          setComments(commentList);
          setLoading(false);
        }
      );
    });
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentWorkspace, postId]);
  
  const handleAddComment = async (text) => {
    await addComment(postId, { text });
  };
  
  const handleDeleteComment = async (commentId) => {
    if (confirm('Delete this comment?')) {
      await deleteComment(postId, commentId);
    }
  };
  
  const canDelete = true; // Could check user role here
  
  if (!canComment) {
    return null;
  }
  
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        aria-expanded={isExpanded}
        aria-controls="comments-section"
      >
        <i className={clsx('fas fa-chevron-right transition-transform', isExpanded && 'rotate-90')} aria-hidden="true" />
        <i className="fas fa-comment" aria-hidden="true" />
        <span>Comments</span>
        {comments.length > 0 && (
          <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">
            {comments.length}
          </span>
        )}
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div id="comments-section" className="mt-4 space-y-4">
          {/* Comment List */}
          {loading ? (
            <div className="text-center py-4">
              <i className="fas fa-spinner fa-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.uid}
                  onDelete={handleDeleteComment}
                  canDelete={canDelete}
                />
              ))}
            </div>
          )}
          
          {/* Input */}
          <CommentInput onSubmit={handleAddComment} />
        </div>
      )}
    </div>
  );
};

export { CommentItem, CommentInput, CommentThread };
export default CommentThread;