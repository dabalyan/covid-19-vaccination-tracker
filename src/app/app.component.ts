import {Component, OnInit} from '@angular/core';
import {DataService} from './data.service';
import * as Highcharts from 'highcharts/highmaps';
import worldMap from '@highcharts/map-collection/custom/world.geo.json';
import {BehaviorSubject, combineLatest} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';

const splineAreaChartOptions = (sharedTooltip = true): Highcharts.Options => ({
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
  },
  yAxis: {
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
        return new Date(this.value).toLocaleDateString();
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
    backgroundColor: 'rgba(255, 255, 255, .9)',
    borderColor: '#000',
    borderRadius: 8,
    shared: sharedTooltip,
    useHTML: true,
    // tslint:disable-next-line:only-arrow-functions typedef
    formatter() {
      const oneDoseMsg = `<h1>${(sharedTooltip ? this.points[0]?.y : this.y) ?? '-'}%</h1>
<h3>of population got at least 1 shot.</h3>`;
      const fullDoseMsg = `<h1>${(sharedTooltip ? this.points[1]?.y : this.y) ?? '-'}%</h1>
<h3>of population got fully vaccinated.</h3>`;
      return (
        `<h2>${new Date(this.x).toLocaleDateString()}</h2>` +
        ((sharedTooltip && oneDoseMsg + fullDoseMsg) ||
          ((this.series.userOptions as any).projectionType === 'oneDose' && oneDoseMsg) ||
          fullDoseMsg)
      );
    },
  },
});

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;

  worldMapChartOptions: Highcharts.Options = {
    title: null,
    credits: {enabled: false},
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, .9)',
      borderColor: '#000',
      borderRadius: 8,
      shared: true,
      useHTML: true,
      // tslint:disable-next-line:only-arrow-functions typedef
      formatter(...args) {
        const data = (this.point as any)?.data as VaccinationDataPerCountry;
        return `
<h2>${data.country}</h2>
<h1>${data.latest.total_vaccinations_per_hundred ?? '-'}</h1>
<h4>doses given per 100 people.</h4>
<h1>${data.latest.people_vaccinated_per_hundred ?? '-'}%</h1>
<h4>of population got at least 1 shot.</h4>
<h1>${data.latest.people_fully_vaccinated_per_hundred ?? '-'}%</h1>
<h4>of population got fully vaccinated.</h4>
<small>Updated: ${data.latest.date}</small>
`;
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
      buttonOptions: {
        alignTo: 'spacingBox',
      },
    },
    legend: {
      enabled: true,
    },
    colors: ['rgba(0,179,107,.1)'],
    colorAxis: {
      max: 100,
      stops: [
        [0, '#ffffff'],
        // [0.1, 'rgba(6,195,77,0.1)'],
        // [0.2, 'rgba(6,195,77,0.2)'],
        // [0.3, 'rgba(6,195,77,0.3)'],
        [0.2, 'rgba(0,179,107,.4)'],
        [0.5, 'rgba(0,179,107,.5)'],
        [0.6, 'rgba(0,179,107,.6)'],
        [0.7, 'rgba(0,179,107,.7)'],
        [0.8, 'rgba(0,179,107,.8)'],
        [0.9, 'rgba(0,179,107,.9)'],
        [1, 'rgb(0,179,107)'],
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

  countryWiseProgressChartOptions: Highcharts.Options = splineAreaChartOptions();
  projectedCountryWiseProgressChartOptions: Highcharts.Options = splineAreaChartOptions(false);

  readonly vaccineProgressSelectedRegion$ = new BehaviorSubject<IsoCode>('OWID_WRL');
  readonly vaccineProgressSelectedRegionSummary$ = combineLatest([
    this.vaccineProgressSelectedRegion$,
    this.dataService.vaccinationDataDict$,
  ]).pipe(
    map(([isoCode, dict]) => dict[isoCode]),
    shareReplay(1)
  );

  readonly projectedVaccineProgressSelectedRegion$ = new BehaviorSubject<IsoCode>('OWID_WRL');
  readonly projectedVaccineProgressSelectedRegionSummary$ = combineLatest([
    this.projectedVaccineProgressSelectedRegion$,
    this.dataService.vaccinationDataDict$,
  ]).pipe(
    map(([isoCode, dict]) => dict[isoCode]),
    shareReplay(1)
  );
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
    });

    combineLatest([
      this.dataService.vaccinationDataDict$,
      this.vaccineProgressSelectedRegion$,
    ]).subscribe(([dict, isoCode]) => {
      while (this.countryWiseProgressChart.series.length > 0) {
        this.countryWiseProgressChart.series[0].remove(true);
      }

      const data = dict[isoCode];
      const peopleVaccinatedPer100series = {
        name: '% of Population Vaccinated',
        data: [],
        color: '#0bd282',
      };
      const fullyVaccinatedPer100series = {
        name: '% of Population Fully Vaccinated',
        data: [],
        color: '#004f30',
      };

      data.data.forEach(entry => {
        peopleVaccinatedPer100series.data.push([
          new Date(entry.date).getTime(),
          entry.people_vaccinated_per_hundred,
        ]);
        fullyVaccinatedPer100series.data.push([
          new Date(entry.date).getTime(),
          entry.people_fully_vaccinated_per_hundred,
        ]);
      });

      this.countryWiseProgressChart.addSeries(peopleVaccinatedPer100series as any);
      this.countryWiseProgressChart.addSeries(fullyVaccinatedPer100series as any);
    });

    combineLatest([
      this.dataService.vaccinationDataDict$,
      this.projectedVaccineProgressSelectedRegion$,
    ]).subscribe(([dict, isoCode]) => {
      while (this.projectedCountryWiseProgressChart.series.length > 0) {
        this.projectedCountryWiseProgressChart.series[0].remove(true);
      }

      const data = dict[isoCode];
      const projectedPeopleVaccinatedPer100series = {
        name: '% of Population Vaccinated',
        data: [],
        color: '#0bd282',
        projectionType: 'oneDose',
      };
      const projectedFullyVaccinatedPer100series = {
        name: '% of Population Fully Vaccinated',
        data: [],
        color: '#004f30',
        projectionType: 'fullDose',
      };

      if (data.projectedDataOneDose) {
        data.projectedDataOneDose.forEach(entry => {
          projectedPeopleVaccinatedPer100series.data.push([
            new Date(entry.date).getTime(),
            entry.people_vaccinated_per_hundred,
          ]);
        });
      }
      if (data.projectedDataFullDose) {
        data.projectedDataFullDose.forEach(entry => {
          projectedFullyVaccinatedPer100series.data.push([
            new Date(entry.date).getTime(),
            entry.people_fully_vaccinated_per_hundred,
          ]);
        });
      }

      this.projectedCountryWiseProgressChart.addSeries(
        projectedPeopleVaccinatedPer100series as any
      );
      this.projectedCountryWiseProgressChart.addSeries(projectedFullyVaccinatedPer100series as any);

      this.isFullDoseHappeningBefore1Dose =
        new Date(data.projectedFullDose?.date).getTime() <
        new Date(data.projectedOneDose?.date).getTime();
    });
  }

  trackByFn(country: VaccinationDataPerCountry): IsoCode {
    return country.iso_code;
  }
}
