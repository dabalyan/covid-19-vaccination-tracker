import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {DataService} from './data.service';
import * as Highcharts from 'highcharts/highmaps';
import worldMap from '@highcharts/map-collection/custom/world.geo.json';
import {kmb, localiseDate} from './utils';

const splineAreaChartOptions = (sharedTooltip = true, yAxisMax = null): Highcharts.Options => ({
  title: null,
  credits: {enabled: false},
  chart: {
    type: 'areaspline',
    animation: false,
    borderWidth: 0,
    backgroundColor: 'transparent',
    style: {
      fontFamily: 'Source Sans Pro',
    },
  },
  mapNavigation: {
    enabled: false,
    buttonOptions: {
      alignTo: 'spacingBox',
    },
  },
  plotOptions: {
    areaspline: {
      fillOpacity: 0.5,
      marker: {enabled: false},
    },
    line: {
      marker: {enabled: false},
    },
  },
  yAxis: {
    max: yAxisMax,
    labels: {
      style: {
        fontSize: '14px',
        fontWeight: '400',
      },
    },
    opposite: true,
    title: {
      text: '% of Population',
      style: {
        fontSize: '14px',
        fontWeight: '400',
      },
    },
  },
  xAxis: {
    type: 'datetime',
    showLastLabel: true,
    labels: {
      // tslint:disable-next-line:only-arrow-functions typedef
      formatter() {
        return localiseDate(this.value as any);
      },
      style: {
        fontSize: '13px',
        fontWeight: '400',
      },
    },
  },
  legend: {
    layout: 'horizontal',
    verticalAlign: 'bottom',
    itemStyle: {
      fontSize: '14px',
      fontWeight: '400',
    },
  },
  tooltip: {
    hideDelay: 0,
    backgroundColor: 'rgba(255, 255, 255, .9)',
    borderColor: '#000',
    borderRadius: 8,
    shared: sharedTooltip,
    useHTML: true,
    // tslint:disable-next-line:only-arrow-functions typedef
    formatter() {
      const s1: any = sharedTooltip
        ? this.points.find((p: any) => p.point.id === 'peopleVaccinatedPer100')
        : this;
      const s2: any = sharedTooltip
        ? this.points.find((p: any) => p.point.id === 'fullyVaccinatedPer100')
        : this;
      const s3: any = sharedTooltip
        ? this.points.find((p: any) => p.point.id === 'dailyVaccinations')
        : this;
      const firstDoseMsg = `<h1>${s1?.y ?? '-'}%</h1>
<h3>of population got at least 1 shot.</h3>`;
      const fullDoseMsg = `<h1>${s2?.y ?? '-'}%</h1>
<h3>of population got fully vaccinated.</h3>`;
      const dailyVaccinationsMsg = `<h1>${kmb(s3?.point.dailyVaccinations) ?? '-'}</h1>
<h3>daily average doses.</h3>`;
      return (
        `<h2>${localiseDate(this.x as any)}</h2>` +
        ((sharedTooltip && firstDoseMsg + fullDoseMsg + dailyVaccinationsMsg) ||
          ((this.series.userOptions as any).projectionType === 'firstDose' && firstDoseMsg) ||
          fullDoseMsg)
      );
    },
  },
});

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;

  worldMapChart: Highcharts.Chart;
  worldMapChartOptions: Highcharts.Options = {
    title: null,
    credits: {enabled: false},
    tooltip: {
      hideDelay: 0,
      backgroundColor: 'rgba(255, 255, 255, .9)',
      borderColor: '#000',
      borderRadius: 8,
      shared: true,
      useHTML: true,
      // tslint:disable-next-line:only-arrow-functions typedef
      formatter() {
        const data = (this.point as any)?.data as VaccinationDataPerCountry;
        return (
          data &&
          `
<h2>${data.country}</h2>
<h1>${data.latest.total_vaccinations_per_hundred ?? '-'}</h1>
<h4>doses given per 100 people.</h4>
<h1>${data.latest.people_vaccinated_per_hundred ?? '-'}%</h1>
<h4>of population got at least 1 shot.</h4>
<h1>${data.latest.people_fully_vaccinated_per_hundred ?? '-'}%</h1>
<h4>of population got fully vaccinated.</h4>
<small>Updated: ${localiseDate(data.latest.date)}</small>
`
        );
      },
    },
    chart: {
      height: '56%',
      animation: false,
      map: worldMap,
      borderWidth: 0,
      margin: 0,
      marginBottom: 50,
      spacing: [0, 0, 0, 0],
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'Source Sans Pro',
      },
    },
    mapNavigation: {
      enabled: false,
      enableButtons: true,
      enableTouchZoom: true,
      buttonOptions: {
        alignTo: 'spacingBox',
      },
    },
    legend: {
      enabled: true,
    },
    colors: ['#57b893'],
    colorAxis: {
      max: 100,
      stops: [
        [0, '#f5fffa'],
        [0.1, '#cbf3de'],
        [0.4, '#6ccba7'],
        [1, '#008352'],
      ],
    },
    series: [
      {
        name: null,
        type: 'map',
        states: {
          hover: {
            color: null,
            brightness: 0,
            borderColor: '#ff2eb9',
          },
        },
        nullColor: '#efefef',
        borderColor: '#000000',
        dataLabels: {
          enabled: false,
        },
        showInLegend: false,
      },
    ],
  };

  countryWiseProgressChart: Highcharts.Chart;
  projectedCountryWiseProgressChart: Highcharts.Chart;
  dailyVaccinationsChart: Highcharts.Chart;

  countryWiseProgressChartOptions: Highcharts.Options = splineAreaChartOptions();
  projectedCountryWiseProgressChartOptions: Highcharts.Options = splineAreaChartOptions(false, 100);
  dailyVaccinationsChartOptions: Highcharts.Options = splineAreaChartOptions(false);

  isFullDoseHappeningBefore1Dose: boolean;

  constructor(public dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.vaccinationDataList$.subscribe(dataList => {
      (this.worldMapChartOptions.series[0] as any).data = dataList.map(entry => ({
        'hc-key': entry.alpha2?.toLowerCase(),
        value: entry.latest.total_vaccinations_per_hundred,
        data: entry,
      }));
      this.worldMapChartOptions = {
        ...this.worldMapChartOptions,
      };
      if (this.worldMapChart) {
        setTimeout(() => {
          this.worldMapChart.reflow();
        });
      }
    });

    this.dataService.vaccineProgressSelectedRegionSummary$.subscribe(country => {
      if (this.countryWiseProgressChart) {
        while (this.countryWiseProgressChart.series.length > 0) {
          this.countryWiseProgressChart.series[0].remove(true);
        }
      }

      const peopleVaccinatedPer100Series = {
        name: '% of Population Vaccinated',
        data: [],
        color: '#0bd282',
      };
      const fullyVaccinatedPer100Series = {
        name: '% of Population Fully Vaccinated',
        data: [],
        color: '#004f30',
      };
      const dailyVaccinationsSeries = {
        type: 'line',
        name: 'Average Daily Vaccinations',
        data: [],
        color: '#234de2',
      };

      country.data.forEach(entry => {
        const timestamp = new Date(entry.date).getTime();
        peopleVaccinatedPer100Series.data.push({
          id: 'peopleVaccinatedPer100',
          x: timestamp,
          y: entry.people_vaccinated_per_hundred,
        });
        fullyVaccinatedPer100Series.data.push({
          id: 'fullyVaccinatedPer100',
          x: timestamp,
          y: entry.people_fully_vaccinated_per_hundred,
        });
        const dailyVaccinationsPer100 = (entry.daily_vaccinations * 100) / country.population;
        dailyVaccinationsSeries.data.push({
          id: 'dailyVaccinations',
          x: timestamp,
          y: isFinite(dailyVaccinationsPer100) ? +dailyVaccinationsPer100.toFixed(2) : null,
          dailyVaccinations: entry.daily_vaccinations,
          data: country,
        });
      });

      if (this.countryWiseProgressChart) {
        this.countryWiseProgressChart.addSeries(peopleVaccinatedPer100Series as any);
        this.countryWiseProgressChart.addSeries(fullyVaccinatedPer100Series as any);
        this.countryWiseProgressChart.addSeries(dailyVaccinationsSeries as any);
      } else {
        this.countryWiseProgressChartOptions.series = [
          peopleVaccinatedPer100Series,
          fullyVaccinatedPer100Series,
          dailyVaccinationsSeries,
        ] as any;
      }
    });

    this.dataService.projectedVaccineProgressSelectedRegionSummary$.subscribe(country => {
      if (this.projectedCountryWiseProgressChart) {
        while (this.projectedCountryWiseProgressChart.series.length > 0) {
          this.projectedCountryWiseProgressChart.series[0].remove(true);
        }
      }

      const projectedPeopleVaccinatedPer100series = {
        name: '% of Population Vaccinated',
        data: [],
        color: '#0bd282',
        projectionType: 'firstDose',
      };
      const projectedFullyVaccinatedPer100series = {
        name: '% of Population Fully Vaccinated',
        data: [],
        color: '#004f30',
        projectionType: 'fullDose',
      };

      if (country.projectedDataFirstDose) {
        country.projectedDataFirstDose.forEach(entry => {
          projectedPeopleVaccinatedPer100series.data.push([
            new Date(entry.date).getTime(),
            entry.people_vaccinated_per_hundred,
          ]);
        });
      }
      if (country.projectedDataFullDose) {
        country.projectedDataFullDose.forEach(entry => {
          projectedFullyVaccinatedPer100series.data.push([
            new Date(entry.date).getTime(),
            entry.people_fully_vaccinated_per_hundred,
          ]);
        });
      }

      if (this.projectedCountryWiseProgressChart) {
        this.projectedCountryWiseProgressChart.addSeries(
          projectedPeopleVaccinatedPer100series as any
        );
        this.projectedCountryWiseProgressChart.addSeries(
          projectedFullyVaccinatedPer100series as any
        );
      } else {
        this.projectedCountryWiseProgressChartOptions.series = [
          projectedPeopleVaccinatedPer100series,
          projectedFullyVaccinatedPer100series,
        ] as any;
      }

      this.isFullDoseHappeningBefore1Dose =
        new Date(country.projectedFullDose?.date).getTime() <
        new Date(country.projectedFirstDose?.date).getTime();
    });
  }

  allowPortraitMode(suggestionEl: HTMLElement): void {
    suggestionEl.style.display = 'none';
    document.body.style.overflowY = 'auto';
  }
}
