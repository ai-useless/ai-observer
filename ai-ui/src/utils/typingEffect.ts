// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const typingEffect = (element: HTMLElement, text: string, speed: number = 50) => {
  let index = 0;
  const content = text;
  
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (index < content.length) {
        element.textContent += content.charAt(index);
        index++;
      } else {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
};
