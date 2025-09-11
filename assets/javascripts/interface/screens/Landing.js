// Landing Page Enhanced Animations and Interactions
// This file contains advanced animations and interactive elements for the Cabra landing page

export class LandingAnimations {
  constructor() {
    this.initParallaxEffects();
    this.initAdvancedAnimations();
    this.initInteractiveElements();
  }

  initParallaxEffects() {
    // Parallax scrolling for hero elements
    gsap.utils.toArray('.hero-visual, .floating-features').forEach(element => {
      gsap.to(element, {
        yPercent: -50,
        ease: "none",
        scrollTrigger: {
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });
  }

  initAdvancedAnimations() {
    // Staggered reveal animations for feature sections
    gsap.utils.toArray('.feature-section').forEach((section, index) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      });

      tl.from(section.querySelector('.feature-badge'), {
        scale: 0,
        duration: 0.5,
        ease: "back.out(1.7)"
      })
      .from(section.querySelector('h2'), {
        y: 30,
        opacity: 0,
        duration: 0.8
      }, "-=0.3")
      .from(section.querySelector('p'), {
        y: 20,
        opacity: 0,
        duration: 0.6
      }, "-=0.4")
      .from(section.querySelectorAll('.stat-item, .highlight, .list-item, .analytics-item'), {
        x: -20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1
      }, "-=0.3");
    });
  }

  initInteractiveElements() {
    // Interactive demo containers
    document.querySelectorAll('.demo-container').forEach(demo => {
      demo.addEventListener('mouseenter', () => {
        gsap.to(demo, {
          scale: 1.02,
          duration: 0.3,
          ease: "power2.out"
        });
      });

      demo.addEventListener('mouseleave', () => {
        gsap.to(demo, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });

    // Feature badge hover effects
    document.querySelectorAll('.feature-badge').forEach(badge => {
      badge.addEventListener('mouseenter', () => {
        gsap.to(badge, {
          scale: 1.1,
          duration: 0.2,
          ease: "back.out(1.7)"
        });
      });

      badge.addEventListener('mouseleave', () => {
        gsap.to(badge, {
          scale: 1,
          duration: 0.2
        });
      });
    });
  }

  // Advanced scroll-triggered animations
  static initScrollAnimations() {
    // Text reveal animations
    gsap.utils.toArray('h1, h2, h3').forEach(heading => {
      gsap.from(heading, {
        scrollTrigger: {
          trigger: heading,
          start: "top 90%"
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });
    });

    // Counter animations
    gsap.utils.toArray('.stat-number').forEach(counter => {
      const value = counter.textContent;
      const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
      
      if (!isNaN(numericValue)) {
        gsap.from({ value: 0 }, {
          scrollTrigger: {
            trigger: counter,
            start: "top 80%"
          },
          value: numericValue,
          duration: 2,
          ease: "power2.out",
          onUpdate: function() {
            const currentValue = this.targets()[0].value;
            if (value.includes('%')) {
              counter.textContent = Math.round(currentValue) + '%';
            } else if (value.includes('€')) {
              counter.textContent = '€' + Math.round(currentValue);
            } else {
              counter.textContent = Math.round(currentValue);
            }
          }
        });
      }
    });
  }

  // Responsive animations
  static updateForMobile() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Reduce animation intensity for mobile
      gsap.globalTimeline.timeScale(0.7);
      
      // Simplify parallax effects
      ScrollTrigger.getAll().forEach(st => {
        if (st.vars.scrub) {
          st.kill();
        }
      });
    } else {
      gsap.globalTimeline.timeScale(1);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LandingAnimations();
  LandingAnimations.initScrollAnimations();
  
  // Update animations on resize
  window.addEventListener('resize', LandingAnimations.updateForMobile);
  LandingAnimations.updateForMobile(); // Initial call
});
