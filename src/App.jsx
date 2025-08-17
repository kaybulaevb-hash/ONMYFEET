@tailwind base;
@tailwind components;
@tailwind utilities;

:root { 
  --accent: #00ff88; 
  --glass-bg: rgba(255, 255, 255, 0.25);
  --glass-border: rgba(255, 255, 255, 0.3);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.dark {
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Glass morphism base styles */
.glass-card {
  @apply rounded-3xl p-8 border transition-all duration-500 hover:scale-[1.01];
  background: linear-gradient(
    135deg,
    var(--glass-bg),
    rgba(255, 255, 255, 0.05)
  );
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Enhanced button styles */
.btn { 
  @apply inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-medium shadow-lg transition-all duration-300 hover:scale-105 active:scale-95; 
  background: linear-gradient(135deg, var(--glass-bg), rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(15px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Smooth scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--accent), rgba(255, 255, 255, 0.3));
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--accent), rgba(255, 255, 255, 0.5));
}

/* Enhanced focus states for better accessibility */
input:focus,
button:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Subtle animations */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(1deg); }
  66% { transform: translateY(-5px) rotate(-1deg); }
}

.float-animation {
  animation: float 6s ease-in-out infinite;
}

/* Glass loading effect */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.loading-shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

/* Text selection styling */
::selection {
  background: var(--accent);
  color: white;
  text-shadow: none;
}

/* Custom utilities */
.text-shadow {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.glass-blur {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Enhanced dark mode transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Support for reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --glass-bg: rgba(255, 255, 255, 0.9);
    --glass-border: rgba(0, 0, 0, 0.5);
  }
  
  .dark {
    --glass-bg: rgba(0, 0, 0, 0.9);
    --glass-border: rgba(255, 255, 255, 0.5);
  }
}
