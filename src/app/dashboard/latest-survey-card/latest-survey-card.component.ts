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
  selector: 'app-latest-survey-card',
  templateUrl: './latest-survey-card.component.html',
  styleUrls: ['./latest-survey-card.component.scss'],
  providers: []
})
export class LatestSurveyCardComponent
  implements OnInit, OnChanges, AfterViewInit {
  @Input() data: any;
  @Input() dateRangeEnabled: boolean = false;

  modes: any[] = [
    { value: 'responses', label: 'Responses' },
    { value: 'response-rates', label: 'Response rates' },
    { value: 'loyalty-segments', label: 'Loyalty segments' },
    { value: 'nps', label: 'NPS' }
  ];

  mode: string = 'responses';

  commonOptions = {
    title: {
      text: undefined
    },
    yAxis: {
      max: 100,
      min: 0,
      title: {
        enabled: false
      }
    },
    credits: {
      enabled: false
    },
    legend: {
      align: 'right',
      verticalAlign: 'top'
    }
  };

  categories: string[] = [];

  chart1: Chart;

  chart2: Chart;

  chart3: Chart;

  chart4: Chart;

  last: any = {};

  // Component constrcutor
  constructor(
    private router: Router,
    private translateService: TranslateService
  ) {}

  // Component init
  ngOnInit() {}

  changeMode() {}

  ngOnChanges() {
    if (!this.data) {
      return;
    }

    if (this.data.teamNPS && this.data.teamNPS.length) {
      this.last =  this.data.teamNPS[this.data.teamNPS.length - 1];
    } else {
      this.data.teamNPS = [];
    }

    this.categories = this.getData('date');
    this.renderResponse();
    this.renderResponseRate();
    this.renderRoyaltySegments();
    this.renderNPS();
  }

  ngAfterViewInit() {}

  onResized1() {
    this.chart1.ref.reflow();
  }

  onResized2() {
    this.chart2.ref.reflow();
  }

  onResized3() {
    this.chart3.ref.reflow();
  }

  onResized4() {
    this.chart4.ref.reflow();
  }

  getData(attr) {
    return this.data.teamNPS.map((item) => item[attr]);
  }

  getOrganisation(attr) {
    return this.data.organisationNPS.map((item) => item[attr]);
  }

  withSign(value) {
    return value > 0 ? `+${value}` : value;
  }

  renderResponse() {
    
    this.chart1 = new Chart({
      ...this.commonOptions,
      chart: {
        type: 'column'
      },
      yAxis: {
        min: 0,
        title: {
          enabled: false
        }
      },
      xAxis: {
        categories: this.categories,
        crosshair: true
      },
      tooltip: {
        headerFormat: '<table>',
        pointFormat:
          '<tr><td style = "color:{series.color};padding:0">{series.name}: </td>' +
          '<td style = "padding:0"><b>{point.y}</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
      },
      plotOptions: {
        column: {
          pointPadding: 0,
          groupPadding: 0.2,
          states: {
            hover: {
              enabled: false
            }
          }
        },
        series: {
          dataLabels: {
            enabled: true,
            inside: true,
            useHTML: true
          }
        }
      },
      series: [
        {
          name: 'Responses',
          color: '#D8D8D8',
          dataLabels: [
            {
              verticalAlign: 'top',
              y: -5,
              format:
                '<span style="color: #212121; font-family: Inter, sans-serif; font-size: 10px;">{point.y}</span>'
            }
          ],
          data: this.getData('count')
        }
      ]
    } as any);
  }

  renderResponseRate() {
    this.chart2 = new Chart({
      ...this.commonOptions,
      chart: {
        type: 'column'
      },
      xAxis: {
        categories: this.categories,
        crosshair: true
      },
      tooltip: {
        headerFormat: '<table>',
        pointFormat:
          '<tr><td style = "color:{series.color};padding:0">{series.name}: </td>' +
          '<td style = "padding:0"><b>{point.y}%</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
      },
      plotOptions: {
        column: {
          pointPadding: 0,
          groupPadding: 0.2,
          states: {
            hover: {
              enabled: false
            }
          }
        },
        series: {
          dataLabels: {
            enabled: true,
            inside: true,
            useHTML: true
          }
        }
      },
      series: [
        {
          name: 'Response rate',
          dataLabels: [
            {
              verticalAlign: 'top',
              y: -5,
              format:
                '<span style="color: #292bb32; font-family: Inter, sans-serif; font-size: 10px;">{point.y}%</span>'
            }
          ],
          color: '#292b32',
          data: this.getData('responseRate')
        },
        {
          name: 'Firm average',
          dataLabels: [
            {
              verticalAlign: 'top',
              y: -5,
              format:
                '<span style="color: #292bb32; font-family: Inter, sans-serif; font-size: 10px;">{point.y}%</span>'
            }
          ],
          color: '#D8D8D8',
          data: this.getOrganisation('responseRate')
        }
      ]
    } as any);
  }

  renderRoyaltySegments() {
    this.chart3 = new Chart({
      ...this.commonOptions,
      chart: {
        type: 'line'
      },
      xAxis: {
        categories: this.categories,
        crosshair: true
      },
      tooltip: {
        headerFormat:
          '<span style = "font-size:10px">{point.key}</span><table>',
        pointFormat:
          '<tr><td style = "color:{series.color};padding:0">{series.name}: </td>' +
          '<td style = "padding:0"><b>{point.y}%</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
      },
      plotOptions: {
        line: {
          marker: {
            radius: 6,
            fillColor: '#ffffff',
            lineColor: '#666666',
            lineWidth: 1
          }
        }
      },

      series: [
        {
          name: 'Promoters',
          color: '#11C598',
          marker: {
            symbol: 'circle'
          },
          data: this.getData('promoterPercent')
        },
        {
          name: 'Neutrals',
          color: '#9B9B9B',
          marker: {
            symbol: 'circle'
          },
          data: this.getData('neutralPercent')
        },
        {
          name: 'Detractors',
          color: '#F50057',
          marker: {
            symbol: 'circle'
          },
          data: this.getData('detractorPercent')
        }
      ]
    } as any);
  }

  renderNPS() {
    this.chart4 = new Chart({
      ...this.commonOptions,
      chart: {
        type: 'line'
      },
      yAxis: {
        max: 100,
        min: -100,
        title: {
          enabled: false
        }
      },
      xAxis: {
        categories: this.categories,
        crosshair: true
      },
      plotOptions: {
        line: {
          marker: {
            radius: 6,
            fillColor: '#ffffff',
            lineColor: '#666666',
            lineWidth: 1
          }
        }
      },
      tooltip: {
        shared: true
      },
      series: [
        {
          name: 'NPS',
          color: '#3D5AFE',
          marker: {
            symbol: 'circle'
          },
          data: this.getData('nps')
        },
        {
          name: 'Firm average',
          color: '#9B9B9B',
          marker: {
            symbol: 'circle'
          },
          data: this.getOrganisation('nps')
        }
      ]
    } as any);
  }
}
