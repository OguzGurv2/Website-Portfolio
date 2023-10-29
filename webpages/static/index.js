addEventListener("DOMContentLoaded", function(){

  function setChildHeights() {
    const children = document.querySelectorAll('.r-child');
  
    // Find the maximum height among child elements
    let heights = [];

    children.forEach(child => {

      child.style.height = 'fit-content'; // Reset the height to auto for accurate calculations
      var childHeight = child.offsetHeight;
      heights.push(childHeight);
    });
    // Loop through the array in increments of 4
    for (var i = 0; i < heights.length; i += 4) {

      var set = heights.slice(i, i + 4); // Get a set of 4 elements
      var maxInSet = Math.max(...set); // Find the maximum in the set

      for (var j = i; j < i + 4 && j < heights.length; j++) {
        children[j].style.height = `${maxInSet}px`;
      };
    };
  };

  const addRecommendation = document.querySelector('.add-recommendation');
  const recommendationScreen = document.getElementById('r-screen');
  const body = document.querySelector('body');
  
  addRecommendation.addEventListener('click', () => {
    
    recommendationScreen.classList.remove('hidden');
    body.style.overflow = 'hidden';
  });
  
  const closeButton = document.getElementById('close-button');
  
  closeButton.addEventListener('click', () => {
    
    recommendationScreen.classList.add('hidden');
    body.style.overflow = 'auto';
  });
 
  const submitButton = document.getElementById('submit-btn');
  const textarea = document.getElementById('recommendation');
  const rContainer = document.getElementById('r-container');
  const thxMsg = document.getElementById('thx-msg');
  
  submitButton.addEventListener('click', () => {

    var newRecommendation;
    newRecommendation = textarea.value;

    if(newRecommendation.trim() !== '') {

      const lastChild = document.querySelector('.last-child');
      rContainer.removeChild(lastChild);
      
      var newDiv = document.createElement('div');
      newDiv.classList.add('r-child');
      
      // Create a paragraph element and add the class 'r-paragraph'
      var newParagraph = document.createElement('p');
      newParagraph.classList.add('r-paragraph');
      
      // Set the text content of the paragraph
      newParagraph.textContent = newRecommendation;
      
      // Append the paragraph to the div
      newDiv.appendChild(newParagraph);

      thxMsg.classList.remove('hidden');
      
      // Append the new div to the parent element
      rContainer.appendChild(newDiv);
      rContainer.appendChild(lastChild);
    };
    recommendationScreen.classList.add('hidden');
    body.style.overflow = 'auto';

    setChildHeights();
  });

  const msgClose = document.getElementById('msg-close');

  msgClose.addEventListener('click', () => {
    
    thxMsg.classList.add('hidden');
  });

  // Call the function initially and add an event listener for window resize
  setChildHeights();
  window.addEventListener('resize', setChildHeights);
});
