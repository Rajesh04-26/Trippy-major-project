const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('ratingInput');
    const ratingValueText = document.getElementById('ratingValue');
    let selectedRating = 0;

    function updateStars(currentRating) {
      stars.forEach((star, index) => {
        const starNumber = index + 1;
        star.classList.remove('full', 'half');

        if (currentRating >= starNumber) {
          star.classList.add('full');
        } else if (currentRating + 0.5 >= starNumber) {
          star.classList.add('half');
        }
      });
    }

    stars.forEach((star, index) => {
      star.addEventListener('mousemove', (event) => {
        const starBox = star.getBoundingClientRect();
        const mouseX = event.clientX - starBox.left;
        const starWidth = starBox.width;
        const isLeftHalf = mouseX < starWidth / 2;

        const tempRating = index + (isLeftHalf ? 0.5 : 1);
        updateStars(tempRating);
      });

      star.addEventListener('click', (event) => {
        const starBox = star.getBoundingClientRect();
        const mouseX = event.clientX - starBox.left;
        const starWidth = starBox.width;
        const isLeftHalf = mouseX < starWidth / 2;

        selectedRating = index + (isLeftHalf ? 0.5 : 1);
        ratingInput.value = selectedRating;
        ratingValueText.textContent = selectedRating;
        updateStars(selectedRating);
      });

      star.addEventListener('mouseleave', () => {
        updateStars(selectedRating);
      });
    });

    updateStars(selectedRating);