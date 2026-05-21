export const handleEnterNavigation = (event, submitCallback) => {
  if (event.key !== 'Enter') return;

  const currentElement = event.target;
  const { form } = currentElement;
  if (!form) return;

  const formElements = Array.from(form.elements).filter((el) => {
    return ['INPUT', 'BUTTON', 'SELECT'].includes(el.tagName) && el.type !== 'hidden' && !el.disabled;
  });

  const currentIndex = formElements.indexOf(currentElement);
  if (currentIndex === -1) return;

  const nextElement = formElements[currentIndex + 1];

  if (nextElement && nextElement.type !== 'submit' && nextElement.tagName !== 'BUTTON') {
    event.preventDefault();
    nextElement.focus();
  } else if (currentElement.type !== 'submit' && submitCallback) {
    event.preventDefault();
    submitCallback(event);
  }
};