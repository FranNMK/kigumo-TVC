// Mobile Hamburger Menu Toggle
function toggleMobileMenu() {
  const navLinks = document.getElementById('navLinks');
  navLinks.classList.toggle('active');
}

// Optional: Close menu automatically when a link is clicked (better UX)
document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    link.addEventListener('click', function() {
      const navLinks = document.getElementById('navLinks');
      if (window.innerWidth <= 992) {
        navLinks.classList.remove('active');
      }
    });
  });
});

