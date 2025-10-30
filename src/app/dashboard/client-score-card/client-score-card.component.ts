// Imports
import { Component, OnInit, OnChanges, AfterViewInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';

function renderIcons() {
  // Move icon
  if (!this.series[0].icon) {
    this.series[0].icon = this.renderer
      .path(['M', -6, 0, 'L', 6, 0, 'M', 0, -6, 'L', 6, 0, 0, 6])
      .attr({
        stroke: '#303030',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': 2,
        zIndex: 10
      })
      .add(this.series[1].group);
  }
  this.series[0].icon.translate(
    this.chartWidth / 2 - 10,
    this.plotHeight / 2 -
      this.series[0].points[0].shapeArgs.innerR -
      (this.series[0].points[0].shapeArgs.r -
        this.series[0].points[0].shapeArgs.innerR) /
        2
  );

  // Exercise icon
  if (!this.series[1].icon) {
    this.series[1].icon = this.renderer
      .path([
        'M',
        -6,
        0,
        'L',
        6,
        0,
        'M',
        0,
        -6,
        'L',
        6,
        0,
        0,
        6,
        'M',
        6,
        -6,
        'L',
        12,
        0,
        6,
        6
      ])
      .attr({
        stroke: '#ffffff',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': 2,
        zIndex: 10
      })
      .add(this.series[1].group);
  }
  this.series[1].icon.translate(
    this.chartWidth / 2 - 10,
    this.plotHeight / 2 -
      this.series[1].points[0].shapeArgs.innerR -
      (this.series[1].points[0].shapeArgs.r -
        this.series[1].points[0].shapeArgs.innerR) /
        2
  );
}

@Component({
  selector: 'app-client-score-card',
  templateUrl: './client-score-card.component.html',
  styleUrls: ['./client-score-card.component.scss'],
  providers: []
})
export class ClientScoreCardComponent
  implements OnInit, OnChanges, AfterViewInit {
  mode: string = 'latest-survey';

  @Input() data: any = {}

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

  chart: Chart;

  // Component constrcutor
  constructor(
    private router: Router,
    private translateService: TranslateService
  ) {}

  // Component init
  ngOnInit() {}

  ngOnChanges() {
    
    this.renderChart();
  }

  ngAfterViewInit() {}

  renderChart() {

    let orgScore = 0; 
    let teamScore = 0;

    orgScore = this.mode === 'latest-survey' ? this.data.latestOrganisationScore : this.data.consolidatedOrganisationScore;
    teamScore = this.mode === 'latest-survey' ? this.data.latestTeamScore : this.data.consolidatedTeamScore;

    this.chart = new Chart({
      chart: {
        type: 'solidgauge',
        events: {
          render: renderIcons
        }
      },
      title: {
        text: undefined
      },
      tooltip: {
        borderWidth: 0,
        backgroundColor: 'none',
        shadow: false,
        useHTML: true,
        style: {
          fontSize: '12px'
        },
        pointFormat:
          '<div style="text-align: center; font-family: Inter, sans-serif;">{series.name}<br><span style="font-size:2em; color: rgba(0, 0, 0, 0.87); font-weight: bold">{point.y}</span></div>',
        positioner(labelWidth) {
          return {
            x: (this.chart.chartWidth - labelWidth) / 2,
            y: this.chart.plotHeight / 2 - 20
          };
        }
      },
      pane: {
        startAngle: 0,
        endAngle: 360,
        background: [
          {
            outerRadius: '112%',
            innerRadius: '88%',
            backgroundColor: Highcharts.color('#3d5afe').setOpacity(0.3).get(),
            borderWidth: 0
          },
          {
            outerRadius: '87%',
            innerRadius: '63%',
            backgroundColor: Highcharts.color('#292b32').setOpacity(0.3).get(),
            borderWidth: 0
          }
        ]
      },
      yAxis: {
        min: 0,
        max: 10,
        lineWidth: 0,
        tickPositions: []
      },
      plotOptions: {
        solidgauge: {
          dataLabels: {
            enabled: false
          },
          linecap: 'round',
          stickyTracking: false,
          rounded: true
        }
      },
      credits: {
        enabled: false
      },
      series: [
        {
          name: 'Firm',
          states: {
            hover: {
              enabled: false
            }
          },
          data: [
            {
              color: '#3d5afe',
              radius: '112%',
              innerRadius: '88%',
              y: orgScore
            }
          ]
        },
        {
          name: 'Individual',
          states: {
            hover: {
              enabled: false
            }
          },
          data: [
            {
              color: '#A0A1A4',
              radius: '87%',
              innerRadius: '63%',
              y: teamScore
            }
          ]
        }
      ]
    } as any);
  }

  changeMode() {
    this.renderChart();
  }

  onResized() {
    this.chart.ref.reflow();
  }
}
