import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

const platformIcons = {
  linkedin: { icon: 'fa-linkedin-in', class: 'bg-blue-600' },
  instagram: { icon: 'fa-instagram', class: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' },
  dribbble: { icon: 'fa-dribbble', class: 'bg-pink-500' },
  facebook: { icon: 'fa-facebook-f', class: 'bg-blue-700' }
};

const SortablePostCard = ({ post, onEdit, onDelete, onToggleComplete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const platform = platformIcons[post.platform] || platformIcons.instagram;
  
  const handleImageError = (e) => {
    e.target.src = 'https://placehold.co/200x100/cccccc/ffffff?text=Error';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm relative post-card transition-all duration-200 hover:shadow-md',
        post.completed && 'opacity-60',
        isDragging && 'shadow-lg ring-2 ring-indigo-500'
      )}
      role="article"
      aria-label={`Post: ${post.title}`}
      aria-roledescription="sortable"
    >
      {/* Actions */}
      <div className="actions absolute top-2 right-2 flex space-x-2">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
          aria-label={`Edit ${post.title}`}
        >
          <i className="fas fa-pencil-alt fa-xs" aria-hidden="true" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1"
          aria-label={`Delete ${post.title}`}
        >
          <i className="fas fa-trash-alt fa-xs" aria-hidden="true" />
        </button>
      </div>
      
      {/* Drag handle indicator */}
      <div className="absolute top-2 left-2 text-gray-300 dark:text-gray-600 cursor-grab" aria-hidden="true">
        <i className="fas fa-grip-vertical fa-xs" />
      </div>
      
      {/* Image */}
      <img
        src={post.image}
        alt={post.title}
        className="rounded-lg mb-3 w-full h-24 object-cover"
        onError={handleImageError}
        draggable={false}
      />
      
      {/* Title */}
      <h4 className={clsx(
        'font-semibold mb-1 truncate dark:text-white ml-3',
        post.completed && 'line-through text-gray-400'
      )}>
        {post.title}
      </h4>
      
      {/* Time */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 ml-3">
        <i className="far fa-clock mr-1" aria-hidden="true" />
        {post.time}
      </p>
      
      {/* Platform icon */}
      <div className="flex items-center space-x-2 ml-3">
        <span className={clsx(
          'w-6 h-6 rounded-full text-white flex items-center justify-center text-sm',
          platform.class
        )}>
          <i className={`fab ${platform.icon}`} aria-hidden="true" />
        </span>
        
        {/* Completion checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={clsx(
            'ml-auto w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200',
            post.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500'
          )}
          aria-label={post.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {post.completed && <i className="fas fa-check text-xs" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
};

export default SortablePostCard;