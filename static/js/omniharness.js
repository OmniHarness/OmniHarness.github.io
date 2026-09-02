function initializeShowcaseCarousel(showcase) {
  if (showcase.dataset.initialized === 'true') {
    return;
  }

  var viewport = showcase.querySelector('.showcase-viewport');
  var cards = Array.from(showcase.querySelectorAll('.showcase-card'));
  var previousButton = showcase.querySelector('.showcase-arrow-previous');
  var nextButton = showcase.querySelector('.showcase-arrow-next');
  var pagination = showcase.querySelector('.showcase-pagination');

  if (!viewport || !cards.length || !previousButton || !nextButton || !pagination) {
    return;
  }

  showcase.dataset.initialized = 'true';

  var currentIndex = 0;
  var pointerStartX = null;
  var suppressClick = false;
  var autoplayTimer = null;
  var autoplayDelay = 5000;
  var isHovered = false;
  var hasFocus = false;

  var dots = cards.map(function(_, index) {
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'showcase-dot';
    dot.setAttribute('aria-label', 'Show result ' + (index + 1));
    dot.addEventListener('click', function() {
      setCurrent(index);
    });
    pagination.appendChild(dot);
    return dot;
  });

  function wrappedDifference(index) {
    var difference = (index - currentIndex + cards.length) % cards.length;
    if (difference > cards.length / 2) {
      difference -= cards.length;
    }
    return difference;
  }

  function syncViewportHeight() {
    var tallestCard = cards.reduce(function(height, card) {
      return Math.max(height, card.scrollHeight);
    }, 0);
    viewport.style.height = (tallestCard + 32) + 'px';
  }

  function updateShowcase() {
    cards.forEach(function(card, index) {
      var difference = wrappedDifference(index);
      var wasActive = card.classList.contains('is-active');
      card.classList.remove('is-active', 'is-prev', 'is-next');

      if (difference === 0) {
        card.classList.add('is-active');
      } else if (difference === -1) {
        card.classList.add('is-prev');
      } else if (difference === 1) {
        card.classList.add('is-next');
      }

      card.setAttribute('aria-hidden', Math.abs(difference) > 1 ? 'true' : 'false');

      card.querySelectorAll('video').forEach(function(video) {
        if (difference === 0 && !document.hidden) {
          if (!wasActive) {
            video.currentTime = 0;
          }

          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function() {});
          }
        } else {
          video.pause();
        }
      });
    });

    dots.forEach(function(dot, index) {
      var isActive = index === currentIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });

    window.requestAnimationFrame(syncViewportHeight);
  }

  function stopAutoplay() {
    if (autoplayTimer !== null) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();
    if (document.hidden || isHovered || hasFocus) {
      return;
    }

    autoplayTimer = window.setInterval(function() {
      setCurrent(currentIndex + 1, false);
    }, autoplayDelay);
  }

  function setCurrent(index, restartAutoplay) {
    currentIndex = (index + cards.length) % cards.length;
    updateShowcase();

    if (restartAutoplay !== false) {
      startAutoplay();
    }
  }

  previousButton.addEventListener('click', function() {
    setCurrent(currentIndex - 1);
  });

  nextButton.addEventListener('click', function() {
    setCurrent(currentIndex + 1);
  });

  cards.forEach(function(card, index) {
    card.addEventListener('click', function(event) {
      if (suppressClick) {
        event.preventDefault();
        return;
      }

      if (card.classList.contains('is-active')) {
        setCurrent(currentIndex + 1);
      } else {
        setCurrent(index);
      }
    });
  });

  showcase.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setCurrent(currentIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setCurrent(currentIndex + 1);
    }
  });

  viewport.addEventListener('pointerdown', function(event) {
    pointerStartX = event.clientX;
    stopAutoplay();
  });

  viewport.addEventListener('pointerup', function(event) {
    if (pointerStartX === null) {
      return;
    }

    var distance = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(distance) < 45) {
      startAutoplay();
      return;
    }

    suppressClick = true;
    setCurrent(currentIndex + (distance < 0 ? 1 : -1));
    window.setTimeout(function() {
      suppressClick = false;
    }, 0);
  });

  viewport.addEventListener('pointercancel', function() {
    pointerStartX = null;
    startAutoplay();
  });

  showcase.addEventListener('mouseenter', function() {
    isHovered = true;
    stopAutoplay();
  });

  showcase.addEventListener('mouseleave', function() {
    isHovered = false;
    startAutoplay();
  });

  showcase.addEventListener('focusin', function() {
    hasFocus = true;
    stopAutoplay();
  });

  showcase.addEventListener('focusout', function(event) {
    if (!showcase.contains(event.relatedTarget)) {
      hasFocus = false;
      startAutoplay();
    }
  });

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      stopAutoplay();
      cards.forEach(function(card) {
        card.querySelectorAll('video').forEach(function(video) {
          video.pause();
        });
      });
    } else {
      updateShowcase();
      startAutoplay();
    }
  });

  if ('ResizeObserver' in window) {
    var resizeObserver = new ResizeObserver(syncViewportHeight);
    cards.forEach(function(card) {
      resizeObserver.observe(card);
    });
  } else {
    window.addEventListener('resize', syncViewportHeight);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncViewportHeight);
  }

  updateShowcase();
  startAutoplay();
}

function initializeShowcaseCarousels() {
  document.querySelectorAll('[data-showcase-carousel]').forEach(function(showcase) {
    initializeShowcaseCarousel(showcase);
  });
}

function initializeEditingShowcase() {
  var showcase = document.querySelector('[data-editing-showcase]');
  if (!showcase || showcase.dataset.initialized === 'true') {
    return;
  }

  var results = [
    { task: 'Remove the plate together with all the food inside it from the table.', original: 'dish_table.png', output: '060.png', aspect: '1 / 1', subject: 'dish table' },
    { task: 'Remove the fork on the table.', original: 'dish_table.png', output: '061.png', aspect: '1 / 1', subject: 'dish table' },
    { task: 'Remove the glass on the table.', original: 'dish_table.png', output: '062.png', aspect: '1 / 1', subject: 'dish table' },
    { task: 'Replace the dish in the plate with some cakes.', original: 'dish_table.png', output: '063.png', aspect: '1 / 1', subject: 'dish table' },
    { task: 'Replace the fork on the table with a spoon.', original: 'dish_table.png', output: '064.png', aspect: '1 / 1', subject: 'dish table' },
    { task: 'Remove the car from the street.', original: 'street_car.png', output: '070.png', aspect: '1 / 1', subject: 'street scene with a car' },
    { task: 'Remove the tree behind the car.', original: 'street_car.png', output: '071.png', aspect: '1 / 1', subject: 'street scene with a car' },
    { task: 'Replace the red car with a green car.', original: 'street_car.png', output: '072.png', aspect: '1 / 1', subject: 'street scene with a car' },
    { task: 'Replace the tree behind the car with a white house.', original: 'street_car.png', output: '073.png', aspect: '1 / 1', subject: 'street scene with a car' },
    { task: 'Replace the ground on the street with grass.', original: 'street_car.png', output: '074.png', aspect: '1 / 1', subject: 'street scene with a car' },
    { task: 'Generate an image of an old man playing the guitar in a forest with the same pose as the girl.', original: 'play_guitar.jpg', output: '077.png', aspect: '3 / 2', subject: 'girl playing guitar' },
    { task: 'Repaint the scribble into a realistic red flower.', original: 'flower_scribble.jpg', output: '091.png', aspect: '59 / 68', subject: 'flower scribble' },
    { task: 'Convert it into a portrait in a large hall while keeping other details.', original: 'woman_photo.jpg', output: '110.png', aspect: '1 / 1', subject: 'woman portrait' },
    { task: 'First follow its style to generate a new image of a grassland. Then convert it into a painting with oil style.', original: 'large_grassland.png', output: '119.png', aspect: '1 / 1', subject: 'grassland' },
    { task: 'First remove the train near the stream. Then follow its content to generate a new image of a stream in a mountain.', original: 'mountain_stream.png', output: '151.png', aspect: '1 / 1', subject: 'mountain stream' },
    { task: 'First repaint the scribble into a realistic red flower. Then follow its style to generate a new image of a large flower field.', original: 'flower_scribble.jpg', output: '154.png', aspect: '59 / 69', subject: 'flower scribble' },
    { task: 'Try to refine the image to make the hands look realistic.', original: 'abnormal_hands.png', output: '161.png', aspect: '2 / 3', subject: 'portrait with abnormal hands' },
    { task: 'Restore the photo so that it is clear and colorful.', original: 'old_photo.jpg', output: '162.png', aspect: '55 / 74', subject: 'old photograph' },
    { task: 'Stylize the castle with a whimsical "ice cream" aesthetic while maintaining its original structure.', original: 'large_castle.png', output: '164.png', aspect: '1 / 1', subject: 'castle' },
    { task: 'Transform the man in the image into a beautiful woman with ponytail hair while preserving the facial identity.', original: 'lovely_man.jpg', output: '170.png', aspect: '2 / 3', subject: 'man portrait' },
    { task: 'Modify the illumination into a bright pink light to create a more vibrant and attractive appearance.', original: 'cosmetic_product.jpg', output: '171.png', aspect: '2 / 3', subject: 'cosmetic product' },
    { task: 'Generate another photo to show the man as an elderly version of himself, with wrinkles, gray hair, and other signs of aging, while preserving his identity.', original: 'young_man.jpg', output: '173.png', aspect: '67 / 60', subject: 'young man portrait' },
  ];

  var task = showcase.querySelector('[data-editing-task]');
  var media = showcase.querySelector('[data-editing-media]');
  var originalImage = showcase.querySelector('[data-editing-original]');
  var comparison = showcase.querySelector('[data-image-compare]');
  var comparisonOriginal = showcase.querySelector('[data-compare-original]');
  var outputImage = showcase.querySelector('[data-editing-output]');
  var comparisonControl = showcase.querySelector('[data-compare-control]');
  var previousButton = showcase.querySelector('.editing-arrow-previous');
  var nextButton = showcase.querySelector('.editing-arrow-next');
  var pagination = showcase.querySelector('[data-editing-pagination]');

  if (!task || !media || !originalImage || !comparison || !comparisonOriginal || !outputImage || !comparisonControl || !previousButton || !nextButton || !pagination) {
    return;
  }

  showcase.dataset.initialized = 'true';

  var originalsBase = 'static/images/omniharness/editing/originals/';
  var outputsBase = 'static/images/omniharness/editing/outputs/';
  var currentIndex = 0;
  var isPointerDown = false;

  function setComparisonPosition(value) {
    var position = Math.min(100, Math.max(0, Number(value)));
    comparison.style.setProperty('--compare-position', position + '%');
    comparisonControl.value = position;
  }

  function setComparisonFromPointer(event) {
    var bounds = comparison.getBoundingClientRect();
    if (!bounds.width) {
      return;
    }
    setComparisonPosition(((event.clientX - bounds.left) / bounds.width) * 100);
  }

  function renderResult() {
    var result = results[currentIndex];
    var originalSource = originalsBase + result.original;
    var outputSource = outputsBase + result.output;
    var originalAlt = 'Original ' + result.subject + ' image';

    task.textContent = result.task;
    media.style.setProperty('--editing-aspect', result.aspect);
    originalImage.src = originalSource;
    originalImage.alt = originalAlt;
    comparisonOriginal.src = originalSource;
    comparisonOriginal.alt = originalAlt;
    outputImage.src = outputSource;
    outputImage.alt = 'Edited result: ' + result.task;
    setComparisonPosition(0);

    dots.forEach(function(dot, index) {
      var isActive = index === currentIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function setResult(index) {
    currentIndex = (index + results.length) % results.length;
    renderResult();
  }

  var dots = results.map(function(_, index) {
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'editing-dot';
    dot.setAttribute('aria-label', 'Show editing result ' + (index + 1));
    dot.addEventListener('click', function() {
      setResult(index);
    });
    pagination.appendChild(dot);
    return dot;
  });

  previousButton.addEventListener('click', function() {
    setResult(currentIndex - 1);
  });

  nextButton.addEventListener('click', function() {
    setResult(currentIndex + 1);
  });

  showcase.addEventListener('keydown', function(event) {
    if (event.target === comparisonControl) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setResult(currentIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setResult(currentIndex + 1);
    }
  });

  comparisonControl.addEventListener('input', function() {
    setComparisonPosition(comparisonControl.value);
  });

  comparison.addEventListener('pointerdown', function(event) {
    isPointerDown = true;
    if (comparison.setPointerCapture) {
      comparison.setPointerCapture(event.pointerId);
    }
    setComparisonFromPointer(event);
  });

  comparison.addEventListener('pointermove', function(event) {
    if (event.pointerType === 'mouse' || isPointerDown) {
      setComparisonFromPointer(event);
    }
  });

  comparison.addEventListener('pointerup', function(event) {
    isPointerDown = false;
    if (comparison.hasPointerCapture && comparison.hasPointerCapture(event.pointerId)) {
      comparison.releasePointerCapture(event.pointerId);
    }
  });

  comparison.addEventListener('pointercancel', function() {
    isPointerDown = false;
  });

  renderResult();
}

function initializeOmniHarnessPage() {
  initializeShowcaseCarousels();
  initializeEditingShowcase();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeOmniHarnessPage);
} else {
  initializeOmniHarnessPage();
}
