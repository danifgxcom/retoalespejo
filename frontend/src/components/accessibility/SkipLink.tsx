import React from 'react';

interface SkipLinkProps {
  /**
   * The ID of the main content element to skip to
   */
  targetId: string;
  /**
   * The text to display in the skip link
   */
  text?: string;
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * SkipLink component allows keyboard users to bypass navigation
 * and jump directly to the main content.
 * 
 * Usage:
 * 1. Add this component at the top of your layout
 * 2. Ensure your main content has the ID specified in targetId
 * 
 * Example:
 * ```tsx
 * <SkipLink targetId="main-content" />
 * <header>...</header>
 * <main id="main-content">...</main>
 * ```
 */
const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  text = 'Skip to main content',
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.tabIndex = -1;
      targetElement.focus();
      // Remove tabIndex after focus to prevent unexpected behavior
      setTimeout(() => {
        if (targetElement) targetElement.removeAttribute('tabIndex');
      }, 100);
    }
  };

  return (
    <a 
      href={`#${targetId}`}
      className={`skip-link ${className}`}
      onClick={handleClick}
    >
      {text}
    </a>
  );
};

export default SkipLink;
