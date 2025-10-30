import {
  trigger,
  animate,
  style,
  group,
  query,
  transition
} from '@angular/animations';

export const routerTransition = trigger('routerTransition', [
  transition('* <=> *', [
    /* order */
    /* 1 */ query(
      ':enter, :leave',
      style({ position: 'fixed', width: '100%' }),
      { optional: true }
    ),
    /* 2 */ group([
      // block executes in parallel
      query(
        ':enter',
        [
          style({ transform: 'translateY(2%)' }),
          animate('0.05s ease-in-out', style({ transform: 'translateY(0%)' }))
        ],
        { optional: true }
      ),
      query(
        ':leave',
        [
          style({ display: 'none' })
          // style({ transform: 'translateY(-100%)' })
          // animate('0.0s ease-in-out', style({ transform: 'translateY(-100%)' }))
        ],
        { optional: true }
      )
    ])
  ])
]);
