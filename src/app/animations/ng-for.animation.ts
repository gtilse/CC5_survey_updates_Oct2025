import { trigger, animate, style, transition } from '@angular/animations';

export const ngForTransition = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: '0' }),
    animate('1s 0.5s ease-out', style({ opacity: '1' }))
  ])
]);
