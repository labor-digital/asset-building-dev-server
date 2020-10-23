import './Index.sass';

// Change this to see the hot reloading in action!
console.log('loaded on dev server!');
console.log('loaded on dev server, too!');
console.log('loaded on dev server, three!');

const el = document.createElement('div');
el.classList.add('myElement');
el.innerHTML = 'HELLO World!';

document.body.appendChild(el);