import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html'
})
export class LoadingComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  @Input() placeholder: string = 'Data';
}
