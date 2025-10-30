// Imports
import { Component, OnInit, OnChanges, AfterViewInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'app-client-follow-up-card',
  templateUrl: './client-follow-up-card.component.html',
  styleUrls: ['./client-follow-up-card.component.scss'],
  providers: []
})
export class ClientFollowUpCardComponent
  implements OnInit, OnChanges, AfterViewInit {

  mode: string = 'number';
  @Input() data: any = {};

  series: any = {
    type: 'bar',
    name: 'score',
    dataLabels: [
      {
        inside: true,
        align: 'right',
        format:
          '<span style="color: #000000; font-family: Inter, sans-serif; font-size: 13px;">{point.value}</span>'
      },
      {
        align: 'left',
        format: '{point.marker}'
      }
    ]
  };

  chart = new Chart({
    chart: {
      type: 'bar',
      margin: 0
    },
    title: {
      text: undefined
    },
    xAxis: {
      visible: false,
      title: {
        text: null
      }
      


    },
    yAxis: {
      visible: false,
      title: {
        text: undefined
      },
      
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          useHTML: true
        },
        pointWidth: 30
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      followPointer: true,
      headerFormat: '<div>Followed-up</div><table>',
      pointFormat:
        '<tr><td style="color: {point.tooltipColor}">{point.name}: </td><td style="text-align: right"><b>{point.value}</b></td></tr>',
      footerFormat: '</table>',
      useHTML: true
    },
    credits: {
      enabled: false
    },
    series: []
  } as any);

  // Component constrcutor
  constructor(
    private router: Router,
    private translateService: TranslateService
  ) {}

  // Component init
  ngOnInit() {}

  
  changeMode() {
    this.chart.removeSeries(0);
    if (this.mode === 'number') {
      this.chart.addSeries(
        {
          ...this.series,
          data: [
            {
              y: this.data.followupPromoters,
              name: 'Promoters',
              color: '#11c598',
              tooltipColor: '#11c598',
              value: this.data.followupPromoters,
              marker:
                '<span style="display:none;color: #11c598; font-family: Inter, sans-serif; font-size: 23px; font-weight: 600">+</span>'
            },
            {
              y: this.data.followupNeutrals,
              name: 'Neutrals',
              color: '#bdbdbd',
              tooltipColor: '#666666',
              value: this.data.followupNeutrals,
              marker:
                '<span style="display:none;color: #11c598; font-family: Inter, sans-serif; font-size: 23px; font-weight: 600">+</span>'
            },
            {
              y: this.data.followupDetractors,
              name: 'Detractors',
              color: '#f50057',
              tooltipColor: '#f50057',
              value: this.data.followupDetractors,
              marker:
                '<span style="display:none;color: #f50057; font-family: Inter, sans-serif; font-size: 23px; font-weight: 600">-</span>'
            },
            
          ]
        } as any,
        true,
        true
      );
    }
    if (this.mode === 'percentage') {
      this.chart.addSeries(
        {
          ...this.series,
          data: [
            {
              y: +this.data.promoterPercent,
              name: 'Promoters',
              color: '#11c598',
              tooltipColor: '#11c598',
              value: this.data.promoterPercent + '%',
              marker:
                '<span style="display:none;color: #11c598; font-family: Inter, sans-serif; font-size: 23px; font-weight: 600">+</span>'
            },
            {
              y: +this.data.neutralsPercent,
              name: 'Neutrals',
              color: '#bdbdbd',
              tooltipColor: '#666666',
              value: this.data.neutralsPercent + '%',
              marker:
                '<span style="display:none;color: #11c598; font-family: Inter, sans-serif; font-size: 23px; font-weight: 600">+</span>'
            },
            {
              y: +this.data.detractorsPercent,
              name: 'Detractors',
              color: '#f50057',
              tooltipColor: '#f50057',
              value: this.data.detractorsPercent + '%',
              marker:
                '<span style="display:none;color: #f50057; font-family: Inter, sans-serif; font-size: 23px; font-weight: 600">-</span>'
            }
          ]
        } as any,
        true,
        true
      );
    }
  }

  ngOnChanges() {
    this.changeMode();
  }

  ngAfterViewInit() {
    this.changeMode();
  }

  onResized() {
    this.chart.ref.reflow();
  }
}
