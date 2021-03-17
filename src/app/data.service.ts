import {Injectable, isDevMode} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, combineLatest, Observable, of, timer} from 'rxjs';
import {delay, map, shareReplay, switchMap, tap} from 'rxjs/operators';
import {Alpha3to2, NameExchange} from './static';

type SortByKey = 'country' | keyof VaccinationDataEntry;

@Injectable({providedIn: 'root'})
export class DataService {
  readonly maxTableEntries$ = new BehaviorSubject<boolean>(false);
  readonly searchInput$ = new BehaviorSubject<string>('');
  readonly sortOrder$ = new BehaviorSubject<'asc' | 'desc'>('asc');
  readonly sortBy$ = new BehaviorSubject<SortByKey>('total_vaccinations');
  private lastSortedBy: SortByKey;

  readonly vaccinationDataList$: Observable<VaccinationDataPerCountry[]> = timer(
    0,
    15 * 60 * 1000 // every 15 minutes
  ).pipe(
    switchMap(() => this.fetchData()),
    shareReplay(1)
  );

  readonly vaccinationFilteredList$: Observable<VaccinationDataPerCountry[]> = combineLatest([
    this.vaccinationDataList$.pipe(
      switchMap(data => this.sortBy$.pipe(map(sortBy => this.sortTableData(sortBy, data))))
    ),
    this.searchInput$,
    this.maxTableEntries$,
  ]).pipe(
    map(([data, search, max]) => {
      const searched = search
        ? data.filter(
            item =>
              item.iso_code === 'OWID_WRL' ||
              item.country.toUpperCase().includes(search) ||
              item.alpha2?.toUpperCase().includes(search) ||
              item.shortName?.toUpperCase().includes(search)
          )
        : data;
      return max ? searched : searched.slice(0, 12);
    }),
    shareReplay(1)
  );

  readonly vaccinationDataDict$: Observable<
    Record<IsoCode, VaccinationDataPerCountry>
  > = this.vaccinationDataList$.pipe(
    map(dataList =>
      dataList.reduce((dict, country) => {
        dict[country.iso_code] = country;
        return dict;
      }, {} as Record<IsoCode, VaccinationDataPerCountry>)
    ),
    shareReplay(1)
  );

  readonly summary$: Observable<VaccinationDataEntry> = this.vaccinationDataDict$.pipe(
    map(dict => dict.OWID_WRL.latest)
  );

  readonly vaccineProgressSelectedRegion$ = new BehaviorSubject<IsoCode>('OWID_WRL');
  readonly vaccineProgressSelectedRegionSummary$ = combineLatest([
    this.vaccineProgressSelectedRegion$,
    this.vaccinationDataDict$,
  ]).pipe(
    map(([isoCode, dict]) => dict[isoCode]),
    shareReplay(1)
  );

  readonly projectedVaccineProgressPercentage$ = new BehaviorSubject<number>(75);
  readonly projectedVaccineProgressSelectedRegion$ = new BehaviorSubject<IsoCode>('OWID_WRL');
  readonly projectedVaccineProgressSelectedRegionSummary$ = combineLatest([
    this.projectedVaccineProgressSelectedRegion$,
    this.projectedVaccineProgressPercentage$,
    this.vaccinationDataDict$,
  ]).pipe(
    map(([isoCode, percent, dict]) => {
      const country: VaccinationDataPerCountry = dict[isoCode];
      if (
        country.latest?.date &&
        country.latest.people_vaccinated &&
        country.latest.people_fully_vaccinated &&
        country.latest.people_vaccinated_per_hundred < percent &&
        country.latest.people_fully_vaccinated_per_hundred < percent
      ) {
        return this.generateVaccinationProgress(country, percent);
      }
      return country;
    }),
    shareReplay(1)
  );

  constructor(private http: HttpClient) {}

  fetchData(): Observable<VaccinationDataPerCountry[]> {
    const cache = isDevMode() && localStorage.getItem('data');
    return (cache
      ? of(JSON.parse(cache)).pipe(delay(0))
      : this.http.get<VaccinationDataPerCountry[]>(
          'https://covid.ourworldindata.org/data/vaccinations/vaccinations.json'
        )
    ).pipe(
      tap(data => {
        data.forEach(country => {
          country.latest = country?.data?.[country.data.length - 1];
          country.date = new Date(country.latest?.date).toLocaleDateString();
          country.alpha2 = Alpha3to2[country.iso_code];
          country.shortName = NameExchange[country.alpha2];
          country.imageUrl =
            country.alpha2 &&
            `https://raw.githubusercontent.com/hampusborgos/country-flags/master/png100px/${country.alpha2.toLowerCase()}.png`;
        });
        if (isDevMode()) {
          localStorage.setItem('data', JSON.stringify(data));
        }
      })
    );
  }

  findFewDaysOlderDataForTrend(data: VaccinationDataEntry[], back = 5): VaccinationDataEntry {
    if (!data.length) {
      return;
    }
    back = Math.min(data.length - 1, back);
    const startFrom = data.length - 1 - back;
    // search backwards
    for (let i = startFrom; i >= 0; i--) {
      const fewDaysBackData = data[i];
      if (fewDaysBackData.people_vaccinated && fewDaysBackData.people_fully_vaccinated) {
        return fewDaysBackData;
      }
    }
    // search forwards
    for (let i = startFrom + 1; i < data.length; i++) {
      const fewDaysBackData = data[i];
      if (fewDaysBackData.people_vaccinated && fewDaysBackData.people_fully_vaccinated) {
        return fewDaysBackData;
      }
    }
  }

  generateVaccinationProgress(
    country: VaccinationDataPerCountry,
    percent: number
  ): VaccinationDataPerCountry {
    const date = new Date(country.latest.date);
    const latestData = country.latest;
    const fewDaysBackData = this.findFewDaysOlderDataForTrend(country.data.slice(0, -1));
    const daysElapsed =
      (date.getTime() - new Date(fewDaysBackData?.date).getTime()) / 60 / 60 / 24 / 1000;

    const firstDoseRate = fewDaysBackData
      ? Math.round((latestData.people_vaccinated - fewDaysBackData.people_vaccinated) / daysElapsed)
      : latestData.people_vaccinated;
    const fullDoseRate = fewDaysBackData
      ? Math.round(
          (latestData.people_fully_vaccinated - fewDaysBackData.people_fully_vaccinated) /
            daysElapsed
        )
      : latestData.people_fully_vaccinated;

    if (!firstDoseRate || !fullDoseRate || !isFinite(firstDoseRate) || !isFinite(fullDoseRate)) {
      return country;
    }

    const population = Math.round(
      (latestData.people_vaccinated * 100) / latestData.people_vaccinated_per_hundred
    );
    const populationToBeVaccinated = Math.round((population * percent) / 100);
    const remainingFirstDose = populationToBeVaccinated - latestData.people_vaccinated;
    const remainingFullDose = populationToBeVaccinated - latestData.people_fully_vaccinated;

    const daysUntilAllFirstDose = Math.round(remainingFirstDose / firstDoseRate);
    const daysUntilAllFullDose = Math.round(remainingFullDose / fullDoseRate);

    const firstDoseTimeSpan = Math.round(daysUntilAllFirstDose / 10);
    const fullDoseTimeSpan = Math.round(daysUntilAllFullDose / 10);

    const timesSpanUntilAllFirstDose = Math.floor(daysUntilAllFirstDose / firstDoseTimeSpan);
    const timeSpansUntilAllFullDose = Math.floor(daysUntilAllFullDose / fullDoseTimeSpan);

    const dateWhenAllFirstDose = new Date(date.getTime());
    dateWhenAllFirstDose.setDate(date.getDate() + daysUntilAllFirstDose);

    const dateWhenAllFullDose = new Date(date.getTime());
    dateWhenAllFullDose.setDate(date.getDate() + daysUntilAllFullDose);

    const projectedDataFirstDose = [];
    const projectedDataFullDose = [];

    [...Array(timesSpanUntilAllFirstDose).keys()].forEach(i => {
      const newDate = new Date(date.getTime());
      newDate.setDate(date.getDate() + (i + 1) * firstDoseTimeSpan);

      if (newDate.getTime() >= dateWhenAllFirstDose.getTime()) {
        return;
      }

      const peopleVaccinated =
        latestData.people_vaccinated + firstDoseRate * (i + 1) * firstDoseTimeSpan;

      projectedDataFirstDose.push({
        date: newDate.toISOString().split('T')[0],
        people_vaccinated: peopleVaccinated,
        people_vaccinated_per_hundred: +((peopleVaccinated * 100) / population).toPrecision(2),
        daily_vaccinations: firstDoseRate,
      });
    });

    [...Array(timeSpansUntilAllFullDose).keys()].map(i => {
      const newDate = new Date(date.getTime());
      newDate.setDate(date.getDate() + (i + 1) * fullDoseTimeSpan);

      if (newDate.getTime() >= dateWhenAllFullDose.getTime()) {
        return;
      }

      const peopleFullyVaccinated =
        latestData.people_fully_vaccinated + fullDoseRate * (i + 1) * fullDoseTimeSpan;

      projectedDataFullDose.push({
        date: newDate.toISOString().split('T')[0],
        people_fully_vaccinated: peopleFullyVaccinated,
        people_fully_vaccinated_per_hundred: +(
          (peopleFullyVaccinated * 100) /
          population
        ).toPrecision(2),
        daily_vaccinations: fullDoseRate,
      });
    });

    projectedDataFirstDose.push({
      date: dateWhenAllFirstDose.toISOString().split('T')[0],
      people_vaccinated: populationToBeVaccinated,
      people_vaccinated_per_hundred: percent,
      daily_vaccinations: firstDoseRate,
    });

    projectedDataFullDose.push({
      date: dateWhenAllFullDose.toISOString().split('T')[0],
      people_fully_vaccinated: populationToBeVaccinated,
      people_fully_vaccinated_per_hundred: percent,
      daily_vaccinations: fullDoseRate,
    });

    projectedDataFirstDose.unshift(country.latest);
    projectedDataFullDose.unshift(country.latest);

    return {
      ...country,
      projectedDataFirstDose,
      projectedDataFullDose,
      projectedFirstDose: projectedDataFirstDose[projectedDataFirstDose.length - 1],
      projectedFullDose: projectedDataFullDose[projectedDataFullDose.length - 1],
    };
  }

  sortTableData(by: SortByKey, data: VaccinationDataPerCountry[]): VaccinationDataPerCountry[] {
    const desc =
      this.lastSortedBy !== by || (this.lastSortedBy === by && this.sortOrder$.value === 'asc');
    this.sortOrder$.next(desc ? 'desc' : 'asc');
    this.lastSortedBy = by;

    return [...data].sort((a, b) => {
      if (a.iso_code === 'OWID_WRL') {
        return -1;
      }
      if (b.iso_code === 'OWID_WRL') {
        return 0;
      }
      if (by === 'country') {
        const nameA = a.country.toUpperCase();
        const nameB = b.country.toUpperCase();
        return nameA > nameB ? (desc ? -1 : 1) : nameA < nameB ? (desc ? 1 : -1) : 0;
      }
      const numA = a.latest[by] || 0;
      const numB = b.latest[by] || 0;
      // @ts-ignore
      return desc ? numB - numA : numA - numB;
    });
  }
}
