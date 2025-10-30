// Imports
import {
  Component,
  OnInit,
  OnChanges,
  AfterViewInit,
  Input
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'app-consolidated-results-card',
  templateUrl: './consolidated-results-card.component.html',
  styleUrls: ['./consolidated-results-card.component.scss'],
  providers: []
})
export class ConsolidatedResultsCardComponent
  implements OnInit, OnChanges, AfterViewInit {
  @Input() data: any;

  mode: string = 'nps';

  chart: Chart;

  // Component constrcutor
  constructor(
    private router: Router,
    private translateService: TranslateService
  ) {}

  // Component init
  ngOnInit() {}

  changeMode() {}

  ngOnChanges() {
    this.chart = new Chart({
      chart: {
        type: 'column'
      },
      title: {
        text: undefined
      },
      xAxis: {
        categories: ['NPS'],
        visible: false
      },
      yAxis: {
        visible: false
      },
      legend: {
        enabled: false
      },
      tooltip: {
        headerFormat:
          '<span style = "font-size:10px">{point.key}</span><table>',
        pointFormat:
          '<tr><td style = "color:{series.color};padding:0">{series.name}: </td>' +
          '<td style = "padding:0"><b>{point.y}%</b></td></tr>',
        footerFormat: '</table>',
        useHTML: true,
        followPointer: true
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
            verticalAlign: 'top',
            format:
              '<span style="color: #000000; font-family: Inter, sans-serif; font-size: 13px;">{point.value}</span>'
          },
          states: {
            hover: {
              enabled: false
            }
          }
        },
        series: {
          stacking: 'normal'
        }
      },
      credits: {
        enabled: false
      },
      series: [
        {
          name: 'Detractors',
          color: '#ed265b',
          data: [this.data.detractors]
        },
        {
          name: 'Neutrals',
          color: '#9b9b9b',
          data: [this.data.neutrals]
        },
        {
          name: 'Promoters',
          color: '#11c598',
          data: [this.data.promoters]
        }
      ]
    } as any);
  }

  ngAfterViewInit() {}

  onResized() {
    this.chart.ref.reflow();
  }
}
