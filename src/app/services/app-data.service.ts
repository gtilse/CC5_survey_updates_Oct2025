import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of } from 'rxjs';

import { catchError, map, tap } from 'rxjs/operators';
import * as moment from 'moment';
import { AppStateService } from './app-state.service';
import { APPSHARED } from '../app-setting';

import {
  ILoggedUser,
  IOrganisation,
  IEmployee,
  IEmployeeInfo,
  IDropList,
  ILocation,
  IClient,
  IClientInfo,
  IEmployeesLocationsSelectList,
  IStaffSelectList,
  IClientScore,
  ISurvey,
  ISurveyStatus,
  IUserProfile,
  IOrganisationSetting,
  IActionItem,
  INotification,
  ISurveyList,
  ILoyaltyDriver,
  ICustomQuestion
} from '../models/data-model';


@Injectable()
export class AppDataService {
  // Constructor
  constructor(
    private http: HttpClient,
    private appStateService: AppStateService
  ) {}

  // Data formatting and creating for different views/chart used across the application
  public dataFormat: any = {
    formatResponses: (responses) => {
      responses.forEach((o, index) => {
        // tslint:disable-next-line: radix
        o.score = parseInt(o.score);
        o.flagged = parseInt(o.flagged);
        o.category = o.category ? o.category : 'None';
        o.responseDate = moment.utc(o.receivedOnDate).toDate();
        o.clientSince = APPSHARED.getClientSinceDescription(o.clientSinceYear);
        o.useCommentsAsTestimonial = parseInt(o.useCommentsAsTestimonial);
        o.testimonialType = parseInt(o.testimonialType);
        o.loyaltyDrivers = o.loyaltyDrivers ? JSON.parse(o.loyaltyDrivers) : [];
        o.drlInclude = o.drlInclude ? JSON.parse(o.drlInclude) : [];

        const allScores = o.allScores ? o.allScores.split(',') : [];
        if (allScores.length > 1) {
          o.previousScore = parseInt(allScores[allScores.length - 2]);
        }

        if (o.allComments) {
          const allComments = o.allComments.split('++++');
          if (allComments.length > 1 && allComments[allComments.length - 2]) {
            o.previousComment = allComments[allComments.length - 2];
          }
        }

        o.additionalQuestions = this.dataFormat.formatAdditionalQuestions(
          o.additionalQuestions
        );

        o.kudos = this.dataFormat.formatKudos(o.kudos);

        o.callRequest = parseInt(o.callRequest);
      });

      return responses;
    },

    formatAdditionalQuestions(oAdditionalQuestions) {
      const additionalQuestions = [];
      if (oAdditionalQuestions) {
        try {
          oAdditionalQuestions = JSON.parse(oAdditionalQuestions);
        } catch (e) {
          oAdditionalQuestions = [];
        }

        oAdditionalQuestions.forEach((item) => {
          switch (item.type) {
            case 0: // text input
              if (item.textInput && item.textInput.trim() !== '') {
                additionalQuestions.push({
                  heading: item.heading,
                  subHeading: item.subHeading,
                  type: item.type,
                  textInput: item.textInput
                });
              }
              break;

            case 1: // single selection
              if (
                item.singleSelectionValue &&
                item.singleSelectionValue.trim() !== ''
              ) {
                additionalQuestions.push({
                  heading: item.heading,
                  subHeading: item.subHeading,
                  type: item.type,
                  options: item.options,
                  singleSelectionValue: item.singleSelectionValue
                });
              }
              break;

            case 2: // multiple selection
              if (
                item.multipleSelectionValue &&
                Array.isArray(item.multipleSelectionValue) &&
                item.multipleSelectionValue.length
              ) {
                additionalQuestions.push({
                  heading: item.heading,
                  subHeading: item.subHeading,
                  type: item.type,
                  options: item.options,
                  multipleSelectionValue: item.multipleSelectionValue
                });
              }
              break;

            default:
              break;
          }
        });
      }

      return additionalQuestions;
    },

    formatKudos(oKudos: any) {
      const kudos: any = {};
      if(oKudos) {
        try {
          oKudos = JSON.parse(oKudos);
        } catch (e) {
          oKudos = {};
        }

        if(oKudos.thanks) {
          kudos.thanks = oKudos.thanks; 
        }

        if(oKudos.kudos) {
          kudos.kudos = oKudos.kudos;
        }
        
      }

      return kudos;
    },

    formatSurveySummary: (surveySummaries) => {
      surveySummaries.forEach((o, index) => {
        o.bounceCount = parseInt(o.bounceCount, 10);
        o.deliveryCount = parseInt(o.deliveryCount, 10);
        o.scoreCount = parseInt(o.scoreCount, 10);
        o.totalCount = parseInt(o.totalCount, 10);
        o.responseRate = Math.round((o.scoreCount / o.totalCount) * 100);
      });

      return surveySummaries;
    },

    responsesChart: (responses, chartType) => {
      const data = _.extend([], responses);
      let chartData = [];
      const chartOptions = { yScaleMax: 0 };

      let propName = '';

      // Set prop name
      switch (chartType) {
        case 'STAFF':
          propName = 'drlName';
          break;

        case 'CLIENT_CATEGORY':
          propName = 'category';
          break;

        case 'CLIENT_INDUSTRY':
          propName = 'industry';
          break;

        default:
          break;
      }

      // Create chart data
      switch (chartType) {
        case 'DATE':
          data.forEach((o, index) => {
            const receivedDates = o.allReceivedOnDates.split(',');
            const scores = o.allScores.split(',');

            receivedDates.forEach((o1, index1) => {
              const i = chartData
                .map(function (e) {
                  return e.day;
                })
                .indexOf(moment.utc(o1).local().format('DDMMYYYY'));

              if (i == -1) {
                chartData.push({
                  name: moment.utc(o1).local().format('MMM DD'),
                  day: moment.utc(o1).local().format('DDMMYYYY'),
                  series: [
                    {
                      name: 'Promoters',
                      value: APPSHARED.scoreType.isPromoter(
                        parseInt(scores[index1])
                      )
                        ? 1
                        : 0
                    },

                    {
                      name: 'Neturals',
                      value: APPSHARED.scoreType.isNeutral(
                        parseInt(scores[index1])
                      )
                        ? 1
                        : 0
                    },

                    {
                      name: 'Detractors',
                      value: APPSHARED.scoreType.isDetractor(
                        parseInt(scores[index1])
                      )
                        ? 1
                        : 0
                    }
                  ]
                });
              } else if (
                APPSHARED.scoreType.isPromoter(parseInt(scores[index1]))
              ) {
                chartData[i].series[0].value++;
              } else if (
                APPSHARED.scoreType.isNeutral(parseInt(scores[index1]))
              ) {
                chartData[i].series[1].value++;
              } else {
                chartData[i].series[2].value++;
              }
            });
          });

          chartData.sort(function (a, b) {
            return moment(a.day, 'DDMMYYYY') > moment(b.day, 'DDMMYYYY')
              ? 1
              : -1;
          });

          if (chartData.length > 25) {
            chartData = _.takeRight(chartData, 25);
          }
          break;

        case 'STAFF':
        case 'CLIENT_CATEGORY':
        case 'CLIENT_INDUSTRY':
          data.forEach((o, index) => {
            const receivedDates = o.allReceivedOnDates.split(',');
            const scores = o.allScores.split(',');

            const i = chartData
              .map(function (e) {
                return e.name;
              })
              .indexOf(o[propName] ? o[propName] : 'Unavailable');

            if (i == -1) {
              chartData.push({
                name: o[propName] ? o[propName] : 'Unavailable',

                series: [
                  {
                    name: 'Promoters',
                    value: APPSHARED.scoreType.isPromoter(parseInt(o.score))
                      ? 1
                      : 0
                  },

                  {
                    name: 'Neturals',
                    value: APPSHARED.scoreType.isNeutral(parseInt(o.score))
                      ? 1
                      : 0
                  },

                  {
                    name: 'Detractors',
                    value: APPSHARED.scoreType.isDetractor(parseInt(o.score))
                      ? 1
                      : 0
                  }
                ]
              });
            } else if (APPSHARED.scoreType.isPromoter(parseInt(o.score))) {
              chartData[i].series[0].value++;
            } else if (APPSHARED.scoreType.isNeutral(parseInt(o.score))) {
              chartData[i].series[1].value++;
            } else {
              chartData[i].series[2].value++;
            }
          });

          chartData.sort(function (a, b) {
            return a.name > b.name ? 1 : -1;
          });

          break;

        default:
          break;
      }

      // Hack to control bar width
      if (chartData.length < 15) {
        const empty = '  ';

        for (let i = chartData.length; i <= 15; i++) {
          chartData.push({
            name: empty.repeat(i + 1),
            series: [
              {
                name: 'Promoters',
                value: 0
              },

              {
                name: 'Neturals',
                value: 0
              },

              {
                name: 'Detractors',
                value: 0
              }
            ]
          });
        }
      }

      // Max value for y axis
      let yScaleMax = 0;
      chartData.forEach((o) => {
        const seriesMax =
          o.series[0].value + o.series[1].value + o.series[2].value;
        if (seriesMax > yScaleMax) {
          yScaleMax = seriesMax;
        }
      });

      chartOptions.yScaleMax = Math.ceil(yScaleMax * 1.5);

      // return data
      return { data: chartData, options: chartOptions };
    },

    npsChart: (responses, chartType) => {
      const data = _.extend([], responses);
      const chartData = [];
      const chartOptions = { yScaleMax: 0 };

      let propName = '';

      // Set prop name
      switch (chartType) {
        case 'STAFF':
          propName = 'drlName';
          break;

        case 'CLIENT_CATEGORY':
          propName = 'category';
          break;

        case 'CLIENT_INDUSTRY':
          propName = 'industry';
          break;

        default:
          break;
      }

      data.forEach((o, index) => {
        const i = chartData
          .map(function (e) {
            return e.name;
          })
          .indexOf(o[propName] ? o[propName] : 'Unavailable');

        if (i == -1) {
          chartData.push({
            name: o[propName] ? o[propName] : 'Unavailable',
            promoters: APPSHARED.scoreType.isPromoter(parseInt(o.score))
              ? 1
              : 0,
            neutrals: APPSHARED.scoreType.isNeutral(parseInt(o.score)) ? 1 : 0,
            detractors: APPSHARED.scoreType.isDetractor(parseInt(o.score))
              ? 1
              : 0
          });
        } else if (APPSHARED.scoreType.isPromoter(parseInt(o.score))) {
          chartData[i].promoters++;
        } else if (APPSHARED.scoreType.isNeutral(parseInt(o.score))) {
          chartData[i].neutrals++;
        } else {
          chartData[i].detractors++;
        }
      });

      chartData.forEach(function (o, index) {
        o.value =
          Math.round(
            (o.promoters * 100) / (o.promoters + o.neutrals + o.detractors)
          ) -
          Math.round(
            (o.detractors * 100) / (o.promoters + o.neutrals + o.detractors)
          );
      });

      chartData.sort(function (a, b) {
        return a.name > b.name ? 1 : -1;
      });

      // Hack to control bar width
      if (chartData.length < 15) {
        const empty = '  ';

        for (let i = chartData.length; i <= 15; i++) {
          chartData.push({
            name: empty.repeat(i + 1),
            value: 0
          });
        }
      }

      // return data
      return { data: chartData, options: chartOptions };
    },

    scoreBreakdownChart: (responses) => {
      const data = _.extend([], responses);
      const chartOptions = {};

      const chartData = [
        { name: '0', value: 0 },
        { name: '1', value: 0 },
        { name: '2', value: 0 },
        { name: '3', value: 0 },
        { name: '4', value: 0 },
        { name: '5', value: 0 },
        { name: '6', value: 0 },
        { name: '7', value: 0 },
        { name: '8', value: 0 },
        { name: '9', value: 0 },
        { name: '10', value: 0 }
      ];

      data.forEach((o, index) => {
        chartData[o.score].value++;
      });

      return { data: chartData, options: chartOptions };
    },

    scoreCategoryChart: (responses) => {
      const data = _.extend([], responses);
      const chartOptions = {};

      const chartData = [
        { name: 'Promoters', value: 0 },
        { name: 'Neutrals', value: 0 },
        { name: 'Detractors', value: 0 }
      ];

      data.forEach((o, index) => {
        if (APPSHARED.scoreType.isPromoter(parseInt(o.score, 10))) {
          chartData[0].value++;
        } else if (APPSHARED.scoreType.isNeutral(parseInt(o.score, 10))) {
          chartData[1].value++;
        } else {
          chartData[2].value++;
        }
      });

      return { data: chartData, options: chartOptions };
    },

    responsesDetailChart: (responses, npsType) => {
      const data = _.extend([], responses);
      const chartOptions = { nps: null };

      const chartData = [
        { name: 'Promoters', value: 0 },
        { name: 'Neutrals', value: 0 },
        { name: 'Detractors', value: 0 }
      ];

      data.forEach((o, index) => {
        if (
          npsType !== 'SELF' ||
          o.drlId == this.appStateService.loggedUser.objectId
        ) {
          if (APPSHARED.scoreType.isPromoter(parseInt(o.score, 10))) {
            chartData[0].value++;
          } else if (APPSHARED.scoreType.isNeutral(parseInt(o.score, 10))) {
            chartData[1].value++;
          } else {
            chartData[2].value++;
          }
        }
      });

      const npsVal = 0;
      const totalCount =
        chartData[0].value + chartData[1].value + chartData[2].value;
      if (totalCount > 0) {
        chartOptions.nps =
          Math.round((chartData[0].value / totalCount) * 100) -
          Math.round((chartData[2].value / totalCount) * 100);
      }

      return { data: chartData, options: chartOptions };
    },

    clientScoreChart: (responses, clientScoreType) => {
      const data = _.extend([], responses);
      const chartOptions = { clientScore: null };
      let totalCount = 0;
      let totalScore = 0;

      const chartData = [{ name: 'Client Score', value: 0 }];

      data.forEach((o, index) => {
        if (
          clientScoreType !== 'SELF' ||
          o.drlId == this.appStateService.loggedUser.objectId
        ) {
          totalScore += parseInt(o.score, 10);
          totalCount += 1;
        }
      });

      if (totalCount > 0) {
        chartOptions.clientScore = chartData[0].value =
          Math.round((totalScore / totalCount) * 2) / 2;
      }

      return { data: chartData, options: chartOptions };
    }
  };

  // Set local storage
  setLocalStorage(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false; // Error, failed to set local storage
    }
  }

  // Get value from local storage
  getLocalStorage(key: string): any {
    return localStorage.getItem(key)
      ? JSON.parse(localStorage.getItem(key))
      : null;
  }

  // Clear local storage key
  clearLocalStorage() {
    localStorage.clear();
  }

  // Verify a logged user
  verifyLoggedUser(userId, token): Observable<ILoggedUser> {
    return this.http
      .post(`${APPSHARED.API_PATH}/verifyLoggedUser`, {
        userId,
        token
      })
      .pipe(
        map(
          (res: any) =>
            <ILoggedUser>{
              objectId: res.objectId,
              vendorId: res.vendorId,
              companyName: res.companyName,
              accessLevel: res.accessLevel,
              picture: res.picture,
              username: res.userName,
              email: res.email,
              firstName: res.firstName,
              middleName: res.middleName,
              lastName: res.lastName,
              token: res.token
            }
        )
      );
  }

  // Submit app feedback
  submitAppFeedback(params: any): Observable<any> {
    params.companyName = this.appStateService.loggedUser.companyName;
    params.user = `${this.appStateService.loggedUser.firstName} ${this.appStateService.loggedUser.lastName}`;
    return this.http.post(`${APPSHARED.API_PATH}/submitAppFeedback`, params);
  }

  // Get Filters
  getFilters(): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/getFilters`, {
      userId: this.appStateService.loggedUser.objectId,
      vendorId: this.appStateService.loggedUser.vendorId
    });
  }

  // Get dashboard for logged in user
  getDashboardForLoggedUser(params: any): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/dashboardForLoggedUser`, {
      userId: this.appStateService.loggedUser.objectId,
      vendorId: this.appStateService.loggedUser.vendorId,
      params
    });
  }

  // Get client feedback
  getClientFeedback(params: any): Observable<any> {
    params = {
      ...params,
      userId: this.appStateService.loggedUser.objectId,
      vendorId: this.appStateService.loggedUser.vendorId
    };
    return this.http.post(`${APPSHARED.API_PATH}/getClientFeedback`, params);
  }

  // Insights panel data
  getInsights(group: string, startDate: string, endDate: string): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/insightsByGroup`, {
      userId: this.appStateService.loggedUser.objectId,
      vendorId: this.appStateService.loggedUser.vendorId,
      group,
      startDate,
      endDate
    });
  }

  // Send kudos
  sendKudos(params: any): Observable<any> {
    params = {
      ...params,
      fromName: `${this.appStateService.loggedUser.firstName} ${this.appStateService.loggedUser.lastName}`,
      fromEmail: this.appStateService.loggedUser.email,
      vendorId: this.appStateService.loggedUser.vendorId
    }

    return this.http.post(`${APPSHARED.API_PATH}/sendKudos`, params);
  }

  // Get pending action items count for logged user
  getPendingActionItemsCount(): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/pendingActionItemsCount`, {
      userId: this.appStateService.loggedUser.objectId,
      vendorId: this.appStateService.loggedUser.vendorId
    });
  }

  // Delete records
  deleteRecords(tableName: string, records: Array<any>) {
    return this.http.post(`${APPSHARED.API_PATH}/deleteRecords`, {
      tableName,
      records,
      vendorId: this.appStateService.loggedUser.vendorId
    });
  }

  // Process CSV file
  processCSVFile(data) {
    return this.http.post<any>(APPSHARED.CSV_FILE_PROCESS_PATH, data);
  }

  // Upload Client CSV File
  uploadClientData(serverFileName: string, columns: Array<any>) {
    return this.http.post(`${APPSHARED.API_PATH}uploadClientData`, {
      vendorId: this.appStateService.loggedUser.vendorId,
      fileName: serverFileName,
      columns
    });
  }

  // Deactivate records
  deactivateRecords(tableName: string, records: Array<any>) {
    return this.http.post(`${APPSHARED.API_PATH}/deactivateRecords`, {
      tableName,
      records,
      vendorId: this.appStateService.loggedUser.vendorId
    });
  }

  // Login user
  loginUser(username: string, password: string): Observable<ILoggedUser> {
    return this.http
      .post(`${APPSHARED.API_PATH}/login`, {
        username,
        password
      })
      .pipe(
        tap((res: any) => {
          this.appStateService.trialMode = res.trial;
        }),

        map(
          (res: any) =>
            <ILoggedUser>{
              objectId: res.objectId,
              vendorId: res.vendorId,
              companyName: res.companyName,
              accessLevel: res.accessLevel,
              picture: res.picture,
              username: res.userName,
              email: res.email,
              firstName: res.firstName,
              middleName: res.middleName,
              lastName: res.lastName,
              token: res.token
            }
        )
      );
  }

  // Assign login
  assignLogin(
    objectId: string,
    userName: string,
    password: string
  ): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/assignLogin`, {
      objectId,
      userName,
      password
    });
  }

  // Remove login
  removeLogin(objectId: string): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/removeLogin`, {
      objectId
    });
  }

  // Send password link for forgotten password
  createPasswordResetLink(username: string): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/createPasswordResetLink`, {
      username
    });
  }

  // Verify password reset link
  verifyPasswordResetLink(verificationCode: string): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/verifyPasswordResetLink`, {
      verificationCode
    });
  }

  // Reset password
  resetPassword(userId: string, password: string): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/resetPassword`, {
      userId,
      password
    });
  }

  // Update User password
  updateUserPassword(objectId: string, password: string): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/updateUserPassword`, {
      objectId,
      password
    });
  }

  // Create new organisation account
  createOrganisation(data: any): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/createOrganisation`, data);
  }

  // Save record
  // Generic procedure
  saveRecord(tableName: string, record: any): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/saverecord`, {
      tableName,
      data: record
    });
  }

  // Organisation
  getOrganisation(): Observable<IOrganisation> {
    return this.http
      .post(`${APPSHARED.API_PATH}/organisation`, {
        vendorId: this.appStateService.loggedUser.vendorId
      })
      .pipe(
        map(
          (res: any) =>
            <IOrganisation>{
              objectId: res.objectId,
              name: res.name,
              email: res.email,
              logo: res.logo,
              address: res.address,
              city: res.city,
              state: res.state,
              postCode: res.postCode,
              primaryContact: res.primaryContact,
              secondaryContact: res.secondaryContact,
              alternateEmail: res.alternateEmail,
              phone: res.phone,
              fax: res.fax,
              mobile: res.mobile
            }
        )
      );
  }

  // Organisation Setting
  getOrganisationSetting(): Observable<IOrganisationSetting> {
    return this.http
      .post(`${APPSHARED.API_PATH}/organisationSetting`, {
        vendorId: this.appStateService.loggedUser.vendorId
      })
      .pipe(
        map(
          (res: any) =>
            <IOrganisationSetting>{
              objectId: res.objectId,
              vendorId: res.vendorId,
              surveyEmailFrom: res.surveyEmailFrom,
              notificationsEmail: res.notificationsEmail,
              followupDays: parseInt(res.followupDays, 10),
              emailMessageNotification:
                res.emailMessageNotification == null
                  ? 0
                  : parseInt(res.emailMessageNotification, 10),
              googlePage: res.googlePage,
              facebookPage: res.facebookPage,
              truelocalPage: res.truelocalPage,
              displaySocialLinksInSurvey:
                res.displaySocialLinksInSurvey == null
                  ? 0
                  : parseInt(res.displaySocialLinksInSurvey, 10),
              automatedEmailSocialMedia:
                res.automatedEmailSocialMedia == null
                  ? 0
                  : parseInt(res.automatedEmailSocialMedia, 10),
              socialMediaReminderDays: parseInt(
                res.socialMediaReminderDays,
                10
              ),
              socialLinksBeforeComments:
                res.socialLinksBeforeComments == null
                  ? 0
                  : parseInt(res.socialLinksBeforeComments, 10),
              testimonialType:
                res.testimonialType == null
                  ? 0
                  : parseInt(res.testimonialType, 10),
              bouncedEmailNotification:
                res.bouncedEmailNotification == null
                  ? 0
                  : parseInt(res.bouncedEmailNotification, 10),
              pendingActionItemsNotification:
                res.pendingActionItemsNotification == null
                  ? 0
                  : parseInt(res.pendingActionItemsNotification, 10),
              newResponsesNotification:
                res.newResponsesNotification == null
                  ? 0
                  : parseInt(res.newResponsesNotification, 10),
              clientSurveyLimit:
                res.clientSurveyLimit == null
                  ? 0
                  : parseInt(res.clientSurveyLimit, 10),

              clientCheckIn: res.clientCheckIn
                ? parseInt(res.clientCheckIn, 10)
                : 0,
              surveySchedule: res.surveySchedule
                ? parseInt(res.surveySchedule, 10)
                : 0,
              surveyScheduleCustom: res.surveyScheduleCustom,
              vendorLevel: res.vendorLevel,
              createdAt: res.createdAt,
              updatedAt: res.updatedAt
            }
        )
      );
  }

  // Drop Lists
  getDropLists(): Observable<IDropList[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/droplists`, {
        vendorId: this.appStateService.loggedUser.vendorId
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <IDropList>{
                objectId: item.objectId,
                vendorId: item.vendorId,
                category: item.category,
                description: item.description,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
              }
          );
        })
      );
  }

  // Droplist - custom caregories
  getDropListCustomCategories(): Observable<string[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/droplistCustomCategories`, {
        vendorId: this.appStateService.loggedUser.vendorId
      }).pipe(
        map((res: any) => {
          return res.map(item => item.category)
      })
    );
  }

  // Employees
  getEmployees(): Observable<IEmployee[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/employees`, {
        vendorId: this.appStateService.loggedUser.vendorId
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <IEmployee>{
                objectId: item.objectId,
                vendorId: item.vendorId,
                active: parseInt(item.active, 10),
                parentId: item.parentId,
                type: parseInt(item.type, 10),
                level: parseInt(item.level, 10),
                userOverrideId: item.userOverrideId,
                locationId: item.locationId,
                firstName: item.firstName,
                middleName: item.middleName,
                lastName: item.lastName,
                userName: item.userName,
                picture: item.picture,
                email: item.email,
                designation: item.designation,
                department: item.department,
                phone: item.phone,
                mobile: item.mobile,
                locationName: item.locationName,
                staffSurveyOnly: parseInt(item.staffSurveyOnly, 10),
                lastSuccessfulLogin: item.lastSuccessfulLogin,
                lastFailedLogin: item.lastFailedLogin,
                loginHistory: item.loginHistory,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
              }
          );
        })
      );
  }

  getEmployeeInfo(staffId: string): Observable<any> {
    return this.http
      .post(`${APPSHARED.API_PATH}/getEmployeeInfo`, {
        vendorId: this.appStateService.loggedUser.vendorId,
        staffId
      })
      .pipe(
        map((res: any) => {
          const item = res.staffInfo;
          const employeeInfo: IEmployeeInfo = {
            objectId: item.objectId,
            vendorId: item.vendorId,
            active: parseInt(item.active, 10),
            type: parseInt(item.type, 10),
            level: parseInt(item.level, 10),
            firstName: item.firstName,
            middleName: item.middleName,
            lastName: item.lastName,
            userName: item.userName,
            picture: item.picture,
            email: item.email,
            designation: item.designation,
            department: item.department,
            phone: item.phone,
            mobile: item.mobile,
            parentName: item.parentName,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          };

          res.surveys.forEach((o: any) => {
            o.score =
              o.score && o.score.length > 0 ? parseInt(o.score, 10) : null;
            o.flagged = parseInt(o.flagged, 10);
            o.emailStatus = parseInt(o.emailStatus, 10);
          });

          return { employeeInfo, surveys: res.surveys };
        })
      );
  }

  // Locations
  getLocations(): Observable<ILocation[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/locations`, {
        vendorId: this.appStateService.loggedUser.vendorId
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <ILocation>{
                objectId: item.objectId,
                vendorId: item.vendorId,
                name: item.name,
                address: item.address,
                city: item.city,
                state: item.state,
                postCode: item.postCode,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
              }
          );
        })
      );
  }

  // Employees/locations select list
  // NOT USED ANYMORE SINCE LOCATION IS A SEPARATE ENTITY
  getEmployeesLocationsSelectList(
    includeLocations: boolean
  ): Observable<IEmployeesLocationsSelectList[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/employeesLocationsSelectList`, {
        vendorId: this.appStateService.loggedUser.vendorId,
        includeLocations
      })
      .pipe(
        map((res: any) => {
          return _.orderBy(
            res.map(
              (item) =>
                <IEmployeesLocationsSelectList>{
                  objectId: item.objectId,
                  active: parseInt(item.active, 10),
                  type: parseInt(item.type, 10),
                  name:
                    parseInt(item.type, 10) ===
                    APPSHARED.EMPLOYEE_TYPE.EMPLOYEE.VALUE
                      ? item.fullName
                      : item.locationName
                }
            ),
            ['name'],
            ['asc']
          );
        })
      );
  }

  // Staff select list
  getStaffSelectList(): Observable<IStaffSelectList[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/staffSelectList`, {
        vendorId: this.appStateService.loggedUser.vendorId
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <IStaffSelectList>{
                objectId: item.objectId,
                active: parseInt(item.active, 10),
                level: parseInt(item.level, 10),
                name: item.name
              }
          );
        })
      );
  }

  // Children for logged in user
  getDescendantsForUser(userId?: string): Observable<IEmployeesLocationsSelectList[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/descendantsForUser`, {
        vendorId: this.appStateService.loggedUser.vendorId,
        userId: userId? userId : this.appStateService.loggedUser.objectId
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <IEmployeesLocationsSelectList>{
                objectId: item.objectId,
                active: parseInt(item.active, 10),
                type: parseInt(item.type, 10),
                name: item.fullName
              }
          );
        })
      );
  }

  // Action items for user
  getActionItems(params): Observable<any> {
    params = {
      ...params,
      userId: this.appStateService.loggedUser.objectId,
      vendorId: this.appStateService.loggedUser.vendorId
    };
    return this.http.post(`${APPSHARED.API_PATH}/actionItems`, params);
  }

  // Clients
  getClients(options): Observable<{ count: number; clients: IClient[] }> {
    return this.http
      .post(`${APPSHARED.API_PATH}/clients`, {
        vendorId: this.appStateService.loggedUser.vendorId,
        ...options
      })
      .pipe(
        map((res: any) => {
          return {
            count: res.count,
            clients: res.clients.map(
              (item) =>
                <IClient>{
                  objectId: item.objectId,
                  vendorId: item.vendorId,
                  active: parseInt(item.active, 10),
                  sendSurveyEmail: parseInt(item.sendSurveyEmail, 10),
                  title: item.title,
                  name: item.name,
                  organisation: item.organisation,
                  email: item.email,
                  code: item.code,
                  referredBefore: +(item.referredBefore
                    ? item.referredBefore
                    : 0),
                  yearOfBirth: item.yearOfBirth
                    ? parseInt(item.yearOfBirth, 10)
                    : null,
                  address: item.address,
                  phone: item.phone,
                  secondaryTitle: item.secondaryTitle,
                  secondaryName: item.secondaryName,
                  secondaryPhone: item.secondaryPhone,
                  secondaryEmail: item.secondaryEmail,
                  tertiaryTitle: item.tertiaryTitle,
                  tertiaryName: item.tertiaryName,
                  tertiaryPhone: item.tertiaryPhone,
                  tertiaryEmail: item.tertiaryEmail,
                  industry: item.industry,
                  companySize: item.companySize,
                  category: item.category,
                  clientGroup: item.clientGroup,
                  clientSinceYear: item.clientSinceYear
                    ? parseInt(item.clientSinceYear, 10)
                    : null,
                  accountSize: item.accountSize,
                  recommendedByExistingClient: +(item.recommendedByExistingClient
                    ? item.recommendedByExistingClient
                    : 0),
                  drl: item.drl,
                  drlInclude: item.drlInclude
                    ? JSON.parse(item.drlInclude)
                    : [],
                  tags: item.tags ? JSON.parse(item.tags) : [],
                  transferredFromDrl: item.transferredFromDrl,
                  transferredFromDrlDate: item.transferredFromDrlDate,
                  transferredFromDrlReason: item.transferredFromDrlReason,
                  customCategory1: item.customCategory1,
                  customCategory1Desc: item.customCategory1Desc,
                  customCategory2: item.customCategory2,
                  customCategory2Desc: item.customCategory2Desc,
                  customCategory3: item.customCategory3,
                  customCategory3Desc: item.customCategory3Desc,
                  createdAt: item.createdAt,
                  updatedAt: item.updatedAt
                }
            )
          };
        })
      );
  }

  // Clients
  getClientsLastScore(options): Observable<IClientScore[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/clientsLastScore`, {
        vendorId: this.appStateService.loggedUser.vendorId,
        options
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <IClientScore>{
                clientId: item.clientId,
                vendorId: item.vendorId,
                name: item.name,
                email: item.email,
                score: parseInt(item.score, 10),
                comments: item.comments,
                receivedOnDate: item.receivedOnDate
              }
          );
        })
      );
  }

  // Client scores
  getScoresForClient(clientId: string): Observable<IClientScore[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/scoresForClient`, {
        vendorId: this.appStateService.loggedUser.vendorId,
        clientId
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <IClientScore>{
                clientId: item.clientId,
                vendorId: item.vendorId,
                name: item.name,
                email: item.email,
                score: parseInt(item.score, 10),
                comments: item.comments,
                receivedOnDate: item.receivedOnDate,
                surveyLogId: item.surveyLogId
              }
          );
        })
      );
  }

  // delete score for client
  deleteScoreForClient(surveyLogId: string): Observable<any> {
    return this.http
      .post(`${APPSHARED.API_PATH}/deleteScoreForClient`, {
        vendorId: this.appStateService.loggedUser.vendorId,
        userId: this.appStateService.loggedUser.objectId,
        surveyLogId
      })
  }

  // Client info
  getClientInfo(clientId: string): Observable<any> {
    return this.http
      .post(`${APPSHARED.API_PATH}/getClientInfo`, {
        vendorId: this.appStateService.loggedUser.vendorId,
        clientId
      })
      .pipe(
        map((res: any) => {
          const item = res.clientInfo;
          const clientInfo: IClientInfo = {
            objectId: item.objectId,
            vendorId: item.vendorId,
            active: parseInt(item.active, 10),
            sendSurveyEmail: parseInt(item.sendSurveyEmail, 10),
            title: item.title,
            name: item.name,
            organisation: item.organisation,
            email: item.email,
            code: item.code,
            yearOfBirth: item.yearOfBirth
              ? parseInt(item.yearOfBirth, 10)
              : null,
            address: item.address,
            phone: item.phone,
            secondaryTitle: item.secondaryTitle,
            secondaryName: item.secondaryName,
            secondaryPhone: item.secondaryPhone,
            secondaryEmail: item.secondaryEmail,
            tertiaryTitle: item.tertiaryTitle,
            tertiaryName: item.tertiaryName,
            tertiaryPhone: item.tertiaryPhone,
            tertiaryEmail: item.tertiaryEmail,
            industry: item.industry,
            companySize: item.companySize,
            category: item.category,
            clientGroup: item.clientGroup,
            clientSinceYear: item.clientSinceYear
              ? parseInt(item.clientSinceYear, 10)
              : null,
            accountSize: item.accountSize,
            recommendedByExistingClient: +(item.recommendedByExistingClient
              ? item.recommendedByExistingClient
              : 0),
            referredBefore: +(item.referredBefore ? item.referredBefore : 0),
            drlName: item.drlName,
            occupation: item.occupation,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          };

          res.surveys.forEach((o: any) => {
            o.score =
              o.score && o.score.length > 0 ? parseInt(o.score, 10) : null;
            o.flagged = parseInt(o.flagged, 10);
            o.emailStatus = parseInt(o.emailStatus, 10);
            o.loyaltyDrivers = o.loyaltyDrivers ? JSON.parse(o.loyaltyDrivers): [];
            o.kudos = o.kudos ? JSON.parse(o.kudos): { kudos: [], thanks: []};

          });

          return { clientInfo, surveys: res.surveys };
        })
      );
  }

  // Save survey drl
  saveSurveyDrl(surveyId: string, drlId: string) {
    return this.http.post(`${APPSHARED.API_PATH}/saveSurveyDrl`, {
      vendorId: this.appStateService.loggedUser.vendorId,
      surveyId,
      drlId
    });
  }

  // Get Surveys
  getSurveys(): Observable<ISurvey[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/surveys`, {
        vendorId: this.appStateService.loggedUser.vendorId
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <ISurvey>{
                objectId: item.objectId,
                vendorId: item.vendorId,
                active: parseInt(item.active),
                type: parseInt(item.type),
                description: item.description,
                surveyHtml: item.surveyHtml,
                reminderHtml: item.reminderHtml,
                emailFrom: item.emailFrom,
                emailSubject: item.emailSubject,
                emailSubjectReminder: item.emailSubjectReminder,
                splitSend: item.splitSend ? parseInt(item.splitSend) : 0,
                frequency: parseInt(item.frequency),
                addLogo: parseInt(item.addLogo),
                newClientsOnly: parseInt(item.newClientsOnly),
                reminderDays: parseInt(item.reminderDays),
                includeDRLS: item.includeDRLS ? JSON.parse(item.includeDRLS) : [],
                includeCategories: item.includeCategories ? JSON.parse(item.includeCategories) : [],
                additionalQuestions: item.additionalQuestions ? JSON.parse(item.additionalQuestions): [],
                excludeEmployees: item.excludeEmployees ? JSON.parse(item.excludeEmployees): [],
                tags: item.tags ? JSON.parse(item.tags) : [],
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                addHowToImproveQuestion: item.addHowToImproveQuestion ? parseInt(item.addHowToImproveQuestion) : 0,
                addHowToImproveQuestion2: item.addHowToImproveQuestion2 ? parseInt(item.addHowToImproveQuestion2) : 0,
                howToImproveQuestionText: item.howToImproveQuestionText,
                howToImproveQuestion2Text: item.howToImproveQuestion2Text,
                loyaltyDrivers: item.loyaltyDrivers ? JSON.parse(item.loyaltyDrivers): [],
                clientSurveyMonthsLimit: item.clientSurveyMonthsLimit ? parseInt(item.clientSurveyMonthsLimit) : 0,
                customClientCategory1: item.customClientCategory1,
                customClientCategory1Desc: item.customClientCategory1Desc,
                customization: item.customization ? JSON.parse(item.customization) : {}
              }
          );
        })
      );
  }

  // Save Survey
  saveSurvey(survey: any): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/saveSurvey`, survey);
  }

  // Get Surveys Status
  getSurveysStatus(options = {}): Observable<ISurveyStatus[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/surveysStatus`, {
        vendorId: this.appStateService.loggedUser.vendorId,
        options
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <ISurveyStatus>{
                surveyId: item.surveyId,
                lastSentOn: item.sendDate,
                lastResponseReceivedOn: item.lastResponseOn,
                lastSentCount: 0,
                lastResponsesCount: 0,
                allSentCount: item.totalSent,
                allResponsesCount: item.totalResponses
              }
          );
        })
      );
  }

  // Get Survey List
  getSurveyList(): Observable<ISurveyList[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/surveyList`, {
        vendorId: this.appStateService.loggedUser.vendorId
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <ISurveyList>{
                objectId: item.objectId,
                active: parseInt(item.active, 10),
                type: parseInt(item.type, 10),
                description: item.description
              }
          );
        })
      );
  }

  // Get Client list for survey
  getClientListForSurvey(surveyId: string): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/clientListForSurvey`, {
      surveyId
    });
  }

  // Get Staff list for survey
  getStaffListForSurvey(surveyId: string): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/staffListForSurvey`, {
      surveyId
    });
  }

  // Get queue for survey
  getQueueForSurvey(surveyId: string, type: number): Observable<any> {
    
    let surveyType = '';
    switch(type){
        case APPSHARED.SURVEY_TYPE.CLIENT.VALUE:
            surveyType = 'CLIENT';
            break;
        case APPSHARED.SURVEY_TYPE.STAFF.VALUE:
            surveyType = 'EMPLOYEE';
            break;
        case APPSHARED.SURVEY_TYPE.PULSE.VALUE:
            surveyType = 'PULSE';
            break;
        case APPSHARED.SURVEY_TYPE.MANAGER.VALUE:
            surveyType = 'MANAGER';
            break;
        case APPSHARED.SURVEY_TYPE.TRIAGE.VALUE:
            surveyType = 'TRIAGE';
            break;
    }

    return this.http.post(`${APPSHARED.API_PATH}/getQueueForSurvey`, {
      surveyId,
      surveyType,
      vendorId: this.appStateService.loggedUser.vendorId
    });

  }

  // Clear queue for survey
  clearQueueForSurvey(surveyId: string, type: number): Observable<any> {
    
    let surveyType = '';
    switch(type){
        case APPSHARED.SURVEY_TYPE.CLIENT.VALUE:
            surveyType = 'CLIENT';
            break;
        case APPSHARED.SURVEY_TYPE.STAFF.VALUE:
            surveyType = 'EMPLOYEE';
            break;
        case APPSHARED.SURVEY_TYPE.PULSE.VALUE:
            surveyType = 'PULSE';
            break;
        case APPSHARED.SURVEY_TYPE.MANAGER.VALUE:
            surveyType = 'MANAGER';
            break;
        case APPSHARED.SURVEY_TYPE.TRIAGE.VALUE:
            surveyType = 'TRIAGE';
            break;
    }

    return this.http.post(`${APPSHARED.API_PATH}/clearQueueForSurvey`, {
      surveyId,
      surveyType,
      vendorId: this.appStateService.loggedUser.vendorId
    });

  }

  // Get Loyalty Drivers master list
  getLoyaltyDrivers(): Observable<ILoyaltyDriver[]> {
    return this.http.post(`${APPSHARED.API_PATH}/appLoyaltyDrivers`, {}).pipe(
      map((res: any) => {
        return res.map(
          (item) =>
            <ILoyaltyDriver>{
              objectId: item.objectId,
              loyaltyDriverId: item.objectId,
              type: item.type,
              description: item.description,
              sortOrder: item.sortOrder ? parseInt(item.sortOrder, 10) : 0
            }
        );
      })
    );
  }

  // Get Custom Questions master list
  getCustomQuestions(): Observable<ICustomQuestion[]> {
    return this.http.post(`${APPSHARED.API_PATH}/appCustomQuestions`, {}).pipe(
      map((res: any) => {
        const customQuestions = res.map(
          (item) =>
            <ICustomQuestion>{
              objectId: item.objectId,
              customQuestionId: item.objectId,
              heading: item.heading,
              subHeading: item.subHeading,
              type: parseInt(item.type, 10),
              typeDescription: item.typeDescription,
              sortOrder: item.sortOrder ? parseInt(item.sortOrder, 10) : 0,
              customQuestionList: []
            }
        );

        res.forEach((val, index) => {
          if (val.customQuestionList) {
            const customQuestionList = val.customQuestionList.split('++++');

            customQuestionList.forEach((item) => {
              const valArr = item.split(';;;;');
              customQuestions[index].customQuestionList.push({
                objectId: valArr[0],
                customQuestionId: valArr[1],
                description: valArr[2],
                weight: parseInt(valArr[3], 10)
              });
            });
          }
        });

        return customQuestions;
      })
    );
  }

  // Get loyalty drivers for survey
  getLoyaltyDriversForSurvey(surveyId: string): Observable<ILoyaltyDriver[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/surveyLoyaltyDrivers`, {
        surveyId,
        vendorId: this.appStateService.loggedUser.vendorId
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <ILoyaltyDriver>{
                objectId: item.objectId,
                vendorId: item.vendorId,
                loyaltyDriverId: item.loyaltyDriverId,
                description: item.description
              }
          );
        })
      );
  }

  // Get custom questions for survey
  getCustomQuestionsForSurvey(surveyId: string): Observable<ICustomQuestion[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/surveyCustomQuestions`, {
        surveyId,
        vendorId: this.appStateService.loggedUser.vendorId
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <ICustomQuestion>{
                objectId: item.objectId,
                vendorId: item.vendorId,
                customQuestionId: item.customQuestionId,
                heading: item.heading,
                subHeading: item.subHeading
              }
          );
        })
      );
  }

  // Get sendIds for Survey
  getSendIdsForSurvey(surveyId: string): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/sendIdsForSurvey`, {
      surveyId
    });
  }

  // Get survey log for client by sendId
  getSurveyLogForClientBySendId(
    sendId: string,
    surveyId: string
  ): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/surveyLogForClientBySendId`, {
      sendId,
      surveyId
    });
  }

  // Get survey log for staff by sendId
  getSurveyLogForStaffBySendId(sendId: string): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/surveyLogForStaffBySendId`, {
      sendId
    });
  }

  // Get survey sending security code
  getSurveySecurityCode(surveyId: string): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/surveySecurityCode`, {
      vendorId: this.appStateService.loggedUser.vendorId,
      surveyId,
      userId: this.appStateService.loggedUser.objectId
    });
  }

  // Queue survey for sending
  queueSurvey(params): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/queueSurvey`, params);
  }

  // Get User Profile
  getUserProfile(userId: string): Observable<IUserProfile> {
    return this.http
      .post(`${APPSHARED.API_PATH}/profile`, {
        objectId: userId,
        vendorId: this.appStateService.loggedUser.vendorId
      })
      .pipe(
        map(
          (res: any) =>
            <IUserProfile>{
              objectId: res.objectId,
              vendorId: res.vendorId,
              level: parseInt(res.level, 10),
              firstName: res.firstName,
              middleName: res.middleName,
              lastName: res.lastName,
              picture: res.picture,
              designation: res.designation,
              department: res.department,
              phone: res.phone,
              mobile: res.mobile,
              userName: res.userName,
              email: res.email,
              lastSuccessfulLogin: res.lastSuccessfulLogin,
              lastFailedLogin: res.lastFailedLogin,
              loginHistory: res.loginHistory ? res.loginHistory : [],
              createdAt: res.createdAt,
              updatedAt: res.updatedAt
            }
        )
      );
  }

  // Save User Profile
  saveUserProfile(record: any): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/saveUserProfile`, {
      data: record
    });
  }

  // Upload File
  uploadFile(data): Observable<any> {
    return this.http.post(APPSHARED.FILE_UPLOAD_API_PATH, data);
  }

  // Save survey log note
  saveSurveyLogNote(objectId, note, addToFollowup = false): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/saveSurveyLogNote`, {
      objectId,
      note,
      userId: this.appStateService.loggedUser.objectId,
      addToFollowup
    });
  }

  // Save survey log note
  saveSurveyLogFlag(objectId, flagged): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/saveSurveyLogFlag`, {
      objectId,
      flagged
    });
  }

  // Save survey log followup
  saveSurveyLogFollowup(objectId, userId, note): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/saveSurveyLogFollowup`, {
      objectId,
      userId,
      note
    });
  }

  // Undo resolved action item
  undoResolvedActionItem(objectId): Observable<any> {
    return this.http.post(`${APPSHARED.API_PATH}/undoResolvedActionItem`, {
      objectId
    });
  }

  // App notifications
  getAppNotifications(): Observable<INotification[]> {
    return this.http
      .post(`${APPSHARED.API_PATH}/appNotifications`, {
        vendorId: this.appStateService.loggedUser.vendorId,
        userId: this.appStateService.loggedUser.objectId,
        userLevel: this.appStateService.loggedUser.accessLevel
      })
      .pipe(
        map((res: any) => {
          return res.map(
            (item) =>
              <INotification>{
                objectId: item.objectId,
                date: item.date,
                notificationType: item.notificationType,
                description: item.description,
                linkedId: item.linkedId
              }
          );
        })
      );
  }

  /// REPORTS ///

  // Client survey status
  reportClientSurveyStatus(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportClientSurveyStatus`,
      params
    );
  }

  // All results - Responders/Non-responders
  reportAllResults(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportAllResults`,
      params
    );
  }


  // Client survey responders
  reportClientSurveyResponders(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportClientSurveyResponders`,
      params
    );
  }

  // Client action items
  reportClientActionItems(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportClientActionItems`,
      params
    );
  }

  // Client survey non responders
  reportClientSurveyNonResponders(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportClientSurveyNonResponders`,
      params
    );
  }

  // Client satisfaction by
  reportClientSatisfactionBy(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportClientSatisfactionBy`,
      params
    );
  }

  // Organisation summary
  reportOrganisationSummary(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportOrganisationSummary`,
      params
    );
  }

  // Staff Survey Status
  reportStaffSurveyStatus(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportStaffSurveyStatus`,
      params
    );
  }

  // Staff Survey Responders
  reportStaffSurveyResponders(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportStaffSurveyResponders`,
      params
    );
  }

  // Pulse Survey status
  reportPulseSurveyStatus(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportPulseSurveyStatus`,
      params
    );
  }

  // Pulse Survey responders
  reportPulseSurveyResponders(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportPulseSurveyResponders`,
      params
    );
  }

  // Manager survey status
  reportManagerSurveyStatus(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportManagerSurveyStatus`,
      params
    );
  }

  // Manager Survey responders
  reportManagerSurveyResponders(params): Observable<any> {
    params.vendorId = this.appStateService.loggedUser.vendorId;
    params.userId = this.appStateService.loggedUser.objectId;
    return this.http.post(
      `${APPSHARED.API_PATH}/reportManagerSurveyResponders`,
      params
    );
  }
}
