// Imports
import { Component, OnInit, OnChanges, AfterViewInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';
import { APPSHARED } from '../../app-setting';

@Component({
  selector: 'app-our-strength-card',
  templateUrl: './our-strength-card.component.html',
  styleUrls: ['./our-strength-card.component.scss'],
  providers: []
})
export class OurStrengthCardComponent implements OnInit, OnChanges, AfterViewInit {
  
  // Component properties
  mode: string = 'strong';
  @Input() loyaltyDrivers: Array<object> = [];
  public loyaltyDriverSelectedIndex = 0;

  series: any = {
    type: 'bar',
    name: 'loyaltyDrivers',
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
    tooltip: { enabled: false },
    title: {
      text: undefined
    },
    xAxis: {
      visible: true,
      title: {
        text: null
      },
      labels: {
        x: 2,
        y: -35,
        align: 'left'
      },
      categories: []
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

  changeMode() {}

  ngOnChanges() {
    this.createChart();
  }

  ngAfterViewInit() {
    this.changeMode();
  }

  onResized() {}

  // Loyalty Drivers
  switchLoyaltyDriversList() {
    
  }

  getLoyaltyDriversList() {

    // Filter the list
    let retArr = this.loyaltyDrivers.filter((elem: any) => {
      if (this.loyaltyDriverSelectedIndex === 0) {
        return elem.positiveCount > 0;
      } else {
        return elem.negativeCount > 0;
      }
    });

    // Sort and return
    retArr.sort((a: any, b: any) => {
      return this.loyaltyDriverSelectedIndex === 0 ? b.positiveCount - a.positiveCount : b.negativeCount - a.negativeCount;
    });

    return retArr.slice(0,3);
  }

  createChart() {

    let chartColor = this.loyaltyDriverSelectedIndex === 0 ? '#11c598' : '#f50057';

    // Filter the list
    let ldArray = this.loyaltyDrivers.filter((elem: any) => {
      if (this.loyaltyDriverSelectedIndex === 0) {
        return elem.positiveCount > 0;
      } else {
        return elem.negativeCount > 0;
      }
    });

    // Sort
    ldArray.sort((a: any, b: any) => {
      return this.loyaltyDriverSelectedIndex === 0 ? b.positiveCount - a.positiveCount : b.negativeCount - a.negativeCount;
    });

    ldArray = ldArray.slice(0,3);

    // Build the chart
    //this.chart.removeSeries(0);
    this.chart = new Chart({
      chart: {
        type: 'bar',
        margin: 0
      },
      tooltip: { enabled: false },
      title: {
        text: undefined
      },
      xAxis: {
        visible: true,
        title: {
          text: null
        },
        labels: {
          useHTML: true,
          x: 2,
          y: 30,
          align: 'left',
          style: {
            width: '300px',
            'font-family': 'Inter, sans-serif'
          }
        },
        categories: ldArray.map((e:any) => {
          return e.desc
        })
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
      credits: {
        enabled: false
      },
      series: []
    } as any);
    
    this.chart.addSeries(
      {
        ...this.series,
        data: ldArray.map((e: any) => {
          return {
            y: this.loyaltyDriverSelectedIndex === 0 ? e.positiveCountPercent : e.negativeCountPercent,
            name: e.desc,
            color: chartColor,
            value: (this.loyaltyDriverSelectedIndex === 0 ? e.positiveCountPercent : e.negativeCountPercent) + '%',
            marker:
              '<span style="display:none;color: #11c598; font-family: Inter, sans-serif; font-size: 23px; font-weight: 600">+</span>'
          }
        })

      } as any,
      true,
      true
    );
    
  }

  // Download CSV
  downloadCSV() {
    APPSHARED.exportToCsv(this.loyaltyDrivers.map((e: any) => {
      return {
        "Loyalty Driver": e.desc,
        "Promoters Count": e.positiveCount,
        "Promoters Percent(%)": e.positiveCountPercent + '%',
        "Improvements Count": e.negativeCount,
        "Improvements Percent(%)": e.negativeCountPercent + '%'
      }
    }), 'Loyalty-Drivers');
  }
}
