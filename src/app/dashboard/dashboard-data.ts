import * as moment from 'moment';
import * as _ from 'lodash';
import { APPSHARED } from '../app-setting';

export let consolidatedThreshold = 11;

export function dashboardData(): object {
    return {

        // Set threshold
        setConsolidatedThreshold(val: number) {
          consolidatedThreshold = val;
        },

        // Summary Card
        summary: {
          clientCheckIn: 'n/a',
          surveySchedule: 'n/a',
          vendorLevel: 'n/a',
          lastSurvey: 'n/a',
          nextSurvey: 'n/a',
          activeClients: 'n/a',
          sharedClients: 'n/a',
          referredClients: 'n/a',
          unsubscribedClients: 'n/a'
        },
    
        // Client followup
        clientFollowup:  {
          promoters: 0,
          neutrals: 0,
          detractors: 0,
    
          followupPromoters: 0,
          followupNeutrals: 0,
          followupDetractors: 0,
    
          promotersPercent: 0,
          neutralsPercent: 0,
          detractorsPercent: 0
        },
    
        // Client score changes
        clientScoreChanges: {
          improving: 0,
          atRisk: 0,
          noChange: 0
        },
    
        // Primary chart
        mainChart: {
          hasData: false,
          type: 'NPS',
          npsChart: {
            type: 'TEAM',
            teamNPS: [],
            organisationNPS: [],
            lastSurveyNPS: 0,
            npsChange: 0,
            lastSurveyResponses: 0,
            responsesChange: 0
          }
          // other charts can go below...todo
        },
    
        // Consolidated NPS
        consolidatedNPS: {
          hasData: false,
          type: 'TEAM',
          nps: 0,
          promoters: 0,
          neutrals: 0,
          detractors: 0
        },
    
        // Client responses
        clientResponses: {
          hasData: false,
          allScores: []
        },
    
        // Team results
        teamResults: {
          hasData: false,
          results: []
        },
    
        // Inisights panel
        insightsPanel: {
          hasData: false,
          results: []
        },
    
        // Client score
        clientScore: {
          hasData: false,
          type: 'TEAM',
          score: 0,
          latestTeamScore: 0,
          latestOrganisationScore: 0,
          consolidatedTeamScore: 0,
          consolidatedOrganisationScore: 0
        },
    
        // Reset state of dashboard to initial
        resetState: () => {
          // Component props
          this._staffResponses = [];
          this._orgResponses = [];
          this._allScores = [];
    
          // Main chart
          this.dashboardData.mainChart.hasData = false;
          this.dashboardData.mainChart.type = 'NPS';
          this.dashboardData.mainChart.npsChart.type = 'TEAM';
          this.dashboardData.mainChart.npsChart.teamNPS = [];
          this.dashboardData.mainChart.npsChart.organisationNPS = [];
          this.dashboardData.mainChart.npsChart.lastSurveyNPS = 0;
          this.dashboardData.mainChart.npsChart.npsChange = 0;
          this.dashboardData.mainChart.npsChart.lastSurveyResponses = 0;
          this.dashboardData.mainChart.npsChart.responsesChange = 0;
          
          // Consolidated NPS
          this.dashboardData.consolidatedNPS.hasData = false;
          this.dashboardData.consolidatedNPS.type = 'TEAM';
          this.dashboardData.consolidatedNPS.nps = 0;
          // Client responses
          this.dashboardData.clientResponses.hasData = false;
          this.dashboardData.clientResponses.allScores = [];
          // Team results
          this.dashboardData.teamResults.hasData = false;
          this.dashboardData.teamResults.results = [];
          // Client score
          this.dashboardData.clientScore.hasData = false;
          this.dashboardData.clientScore.type = 'TEAM';
          this.dashboardData.clientScore.score = 0;
          this.dashboardData.clientScore.latestTeamScore = 0;
          this.dashboardData.clientScore.latestOrganisationScore = 0;
          this.dashboardData.clientScore.consolidatedTeamScore = 0;
          this.dashboardData.clientScore.consolidatedOrganisationScore = 0;
        },
    
    
        // Data preparation

        prepareLoyaltyDrivers(allScores: Array<any>) {
          const loyaltyDrivers = [];


          return loyaltyDrivers;
        },
    
        prepareSummaryCard: (settings: any, clientSummary: any, lastSurvey: any) => {
         
          const summary = this.dashboardData.summary;
          
          // Client checkin
          if (settings.clientCheckIn) {
            const found = APPSHARED.CLIENT_CHECKIN.find(e => e.VALUE == settings.clientCheckIn);
            summary.clientCheckIn = found ? found.DESC : 'n/a';
          } else {
            summary.clientCheckIn = 'n/a';
          }
    
          // Survey schedule
          const found = APPSHARED.SURVEY_SCHEDULE.find(e => e.VALUE == settings.surveySchedule);
          summary.surveySchedule = found ? found.DESC : 'n/a';
    
          // Last survey
          if (lastSurvey) {
            summary.lastSurvey = moment(lastSurvey.year+lastSurvey.month, 'YYYYM').format('MMMM YYYY');
            if (settings.surveySchedule) {
              
              summary.nextSurvey = moment(lastSurvey.year+lastSurvey.month, 'YYYYM').add(+settings.surveySchedule, 'months').format('MMMM YYYY')
            } else {
              summary.nextSurvey = 'n/a';
            }
          } else {
            summary.lastSurvey = 'n/a';
            summary.nextSurvey = 'n/a';
          }

          // Custom survey schedule
          if(settings.surveySchedule == '0') {
            summary.nextSurvey = settings.surveyScheduleCustom;
          }
    
          // Vendor Level
          summary.vendorLevel = settings.vendorLevel;
    
          // Client
          summary.activeClients = clientSummary.activeClients;
          summary.referredClients = clientSummary.referredClients;
          summary.sharedClients = clientSummary.sharedClients;
          summary.unsubscribedClients = clientSummary.unsubscribedClients;
    
        },
    
        prepareDateGroupedChartData: (
          staffResponses: Array<any>,
          orgResponses: Array<any>
        ) => {
          // Staff responses summary
          const teamNPS = [];
          let responses = _.cloneDeep(staffResponses);
    
          // Reset
          this.dashboardData.mainChart.hasData = false;
          this.dashboardData.mainChart.npsChart.teamNPS = [];
          this.dashboardData.mainChart.npsChart.organisationNPS = [];
          this.dashboardData.mainChart.npsChart.lastSurveyNPS = 0;
          this.dashboardData.mainChart.npsChart.npsChange = 0;
    
          // If personal data, then filter
          if (this.dashboardData.mainChart.npsChart.type === 'PERSONAL') {
            responses = responses.filter((r) => {
              return (
                r.drlName.toLowerCase() ===
                `${this.appStateService.loggedUser.firstName} ${this.appStateService.loggedUser.lastName}`.toLowerCase()
              );
            });
          }
    
          if (responses.length > 0) {
            this.dashboardData.mainChart.hasData = true;
          } else {
            this.dashboardData.mainChart.hasData = false;
          }
    
          // Team responses
          responses.forEach((element) => {
            const i = _.findIndex(teamNPS, function (el: any) {
              return el.yearMonth === element.year + element.month;
            });
    
            if (i === -1) {
              teamNPS.push({
                yearMonth: element.year + element.month,
                date: moment(element.year + element.month, 'YYYYM').format(
                  'MMM YYYY'
                ),
                count: element.count,
                countTotal: element.countTotal,
                detractors: element.detractors,
                neutrals: element.neutrals,
                promoters: element.promoters,
                scoreTotal: element.scoreTotal
              });
            } else {
              teamNPS[i].count += element.count;
              teamNPS[i].countTotal += element.countTotal;
              teamNPS[i].detractors += element.detractors;
              teamNPS[i].neutrals += element.neutrals;
              teamNPS[i].promoters += element.promoters;
              teamNPS[i].scoreTotal += element.scoreTotal;
            }
          });
    
          teamNPS.forEach((element) => {
            element.nps =
              Math.round(
                (element.promoters * 100) /
                  ((element.promoters + element.neutrals + element.detractors) || 1)
              ) -
              Math.round(
                (element.detractors * 100) /
                  ((element.promoters + element.neutrals + element.detractors) || 1)
              );
    
            element.promoterPercent = Math.ceil(
              (element.promoters /
                ((element.promoters + element.neutrals + element.detractors) || 1)) *
                100
            );
            element.neutralPercent = Math.ceil(
              (element.neutrals /
                ((element.promoters + element.neutrals + element.detractors) || 1)) *
                100
            );
            element.detractorPercent = Math.ceil(
              (element.detractors /
                ((element.promoters + element.neutrals + element.detractors) || 1)) *
                100
            );
    
            element.responseRate = Math.round(
              (element.count / element.countTotal) * 100
            );
          });
    
          this.dashboardData.mainChart.npsChart.teamNPS = teamNPS.slice(-6);
    
          // Organisation responses summary
          const organisationNPS = [];
          orgResponses.forEach((element) => {
            const i = _.findIndex(
              this.dashboardData.mainChart.npsChart.teamNPS,
              function (el: any) {
                return el.yearMonth === element.year + element.month;
              }
            );
    
            if (i !== -1) {
              organisationNPS.push({
                yearMonth: element.year + element.month,
                date: `${element.year}-${element.month}-1`,
                count: element.count,
                countTotal: element.countTotal,
                detractors: element.detractors,
                neutrals: element.neutrals,
                promoters: element.promoters,
                scoreTotal: element.scoreTotal,
                nps:
                  Math.round(
                    (element.promoters * 100) /
                      (element.promoters + element.neutrals + element.detractors)
                  ) -
                  Math.round(
                    (element.detractors * 100) /
                      (element.promoters + element.neutrals + element.detractors)
                  ),
                responseRate : Math.round(
                    (element.count / element.countTotal) * 100
                )
              });
            }
          });
    
          this.dashboardData.mainChart.npsChart.organisationNPS = organisationNPS.reverse().slice(-6);
    
    
          // Store last and previous survey NPS and responses
          if(this.dashboardData.mainChart.npsChart.teamNPS.length) {
            this.dashboardData.mainChart.npsChart.lastSurveyNPS = this.dashboardData.mainChart.npsChart.teamNPS[
              this.dashboardData.mainChart.npsChart.teamNPS.length - 1
            ].nps;
            this.dashboardData.mainChart.npsChart.lastSurveyResponses = this.dashboardData.mainChart.npsChart.teamNPS[
              this.dashboardData.mainChart.npsChart.teamNPS.length - 1
            ].count;
            this.dashboardData.mainChart.npsChart.lastSurveyResponseRate = this.dashboardData.mainChart.npsChart.teamNPS[
              this.dashboardData.mainChart.npsChart.teamNPS.length - 1
            ].responseRate;
          }

          

          if (this.dashboardData.mainChart.npsChart.teamNPS.length > 1) {
            this.dashboardData.mainChart.npsChart.npsChange =
              this.dashboardData.mainChart.npsChart.lastSurveyNPS -
              this.dashboardData.mainChart.npsChart.teamNPS[
                this.dashboardData.mainChart.npsChart.teamNPS.length - 2
              ].nps;
            this.dashboardData.mainChart.npsChart.responsesChange =
              this.dashboardData.mainChart.npsChart.lastSurveyResponses -
              this.dashboardData.mainChart.npsChart.teamNPS[
                this.dashboardData.mainChart.npsChart.teamNPS.length - 2
              ].count;
            this.dashboardData.mainChart.npsChart.responseRateChange =
              this.dashboardData.mainChart.npsChart.lastSurveyResponseRate -
              this.dashboardData.mainChart.npsChart.teamNPS[
                this.dashboardData.mainChart.npsChart.teamNPS.length - 2
              ].responseRate;
          }
    
          this.latestSurvey = _.cloneDeep(this.dashboardData.mainChart.npsChart);
        },
    
        prepareConsolidatedResult: (staffResponses: Array<any>, orgResponses: Array<any>) => {
          
          let promoters = 0;
          let neutrals = 0;
          let detractors = 0;
          let scoreTotal = 0;
          let count = 0;
          let countTotal = 0;
          const responses = _.cloneDeep(staffResponses);
          
          responses.forEach((element) => {

            //if(moment(`${element.year}${element.month}`,'YYYYM').add(consolidatedThreshold,'M') >= moment()) {
              
              promoters += element.promoters;
              detractors += element.detractors;
              neutrals += element.neutrals;
              scoreTotal += element.scoreTotal;
              count += element.count;
              countTotal += element.countTotal;
            //}
            
          });
    
          this.consolidatedResult = {
            promoters: Math.round(
              (promoters * 100) / ((promoters + neutrals + detractors)||1)
            ),
            neutrals: Math.round(
              (neutrals * 100) / ((promoters + neutrals + detractors)||1)
            ),
            detractors: Math.round(
              (detractors * 100) / ((promoters + neutrals + detractors)||1)
            ),
            nps:
              Math.round((promoters * 100) / ((promoters + neutrals + detractors)||1)) -
              Math.round((detractors * 100) / ((promoters + neutrals + detractors)||1)),
            responseRate: +((count * 100) / (countTotal||1)).toFixed(1),
            responses: count
          };
    
          // Calculate organization NPS
          promoters = neutrals = detractors = count = countTotal = 0;
          orgResponses.forEach(element => {
            // if(moment(`${element.year}${element.month}`,'YYYYM').add(consolidatedThreshold,'M') >= moment()) {
              promoters += element.promoters;
              detractors += element.detractors;
              neutrals += element.neutrals;
              count += element.count;
              countTotal += element.countTotal;
            // }
          });
    
          this.consolidatedResult.orgNPS = Math.round((promoters * 100) / ((promoters + neutrals + detractors)||1)) -
            Math.round((detractors * 100) / ((promoters + neutrals + detractors)||1));
    
          this.consolidatedResult.orgResponseRate = +((count * 100) / (countTotal||1)).toFixed();
    
        },
    
        prepareTeamResults: (staffResponses: Array<any>) => {
          const teamResults: Array<any> = [];
          // Reset
          this.dashboardData.teamResults.hasData = !!staffResponses.length;
          this.dashboardData.teamResults.results = [];
    
          // Calculate team results
          staffResponses.forEach((element) => {
            const i = _.findIndex(teamResults, function (el: any) {
              return el.drlName === element.drlName;
            });
    
            if (i === -1) {
              teamResults.push({
                drlName: element.drlName,
                drlId: element.drlId,
                data: [
                  {
                    yearMonth: element.year + element.month,
                    formattedDate: moment(
                      element.year + element.month,
                      'YYYYM'
                    ).format('MMM YYYY'),
                    count: element.count,
                    detractors: element.detractors,
                    neutrals: element.neutrals,
                    promoters: element.promoters,
                    scoreTotal: element.scoreTotal,
                    followupPromoters: element.followupPromoters,
                    followupNeutrals: element.followupNeutrals,
                    followupDetractors: element.followupDetractors,
    
                    nps:
                      Math.round(
                        (element.promoters * 100) /
                          (element.promoters +
                            element.neutrals +
                            element.detractors)
                      ) -
                      Math.round(
                        (element.detractors * 100) /
                          (element.promoters +
                            element.neutrals +
                            element.detractors)
                      )
                  }
                ]
              });
            } else {
              teamResults[i].data.push({
                yearMonth: element.year + element.month,
                formattedDate: moment(element.year + element.month, 'YYYYM').format(
                  'MMM YYYY'
                ),
                count: element.count,
                detractors: element.detractors,
                neutrals: element.neutrals,
                promoters: element.promoters,
                scoreTotal: element.scoreTotal,
                followupPromoters: element.followupPromoters,
                followupNeutrals: element.followupNeutrals,
                followupDetractors: element.followupDetractors,
    
                nps:
                  Math.round(
                    (element.promoters * 100) /
                      (element.promoters + element.neutrals + element.detractors)
                  ) -
                  Math.round(
                    (element.detractors * 100) /
                      (element.promoters + element.neutrals + element.detractors)
                  )
              });
            }
          });
    
          const teamResultsDisplay: Array<any> = [];
          teamResults.forEach((element) => {
            let npsPrev = '-';
            let npsPrevDate = '-';
            let npsChange = 0;
    
            if (element.data.length > 1) {
              npsPrev = element.data[1].nps;
              npsPrevDate = element.data[1].formattedDate;
              npsChange = element.data[0].nps - element.data[1].nps;
            }
    
            teamResultsDisplay.push({
              drlName: element.drlName,
              drlId: element.drlId,
              npsCurrent: element.data[0].nps,
              formattedDateCurrent: element.data[0].formattedDate,
              npsPrev,
              formattedDatePrev: npsPrevDate,
              npsChange
            });
          });
    
    
          this.dashboardData.teamResults.results = teamResultsDisplay;
    
          // Calculate followup data
          const clientFollowup: any =  {
            promoters: 0,
            neutrals: 0,
            detractors: 0,
    
            followupPromoters: 0,
            followupNeutrals: 0,
            followupDetractors: 0,
    
            promotersPercent: 0,
            neutralsPercent: 0,
            detractorsPercent: 0
          };
    
          teamResults.forEach(element => {
    
            const lastElem = element.data.slice(-1).pop();
            if (lastElem) {
              clientFollowup.promoters += lastElem.promoters;
              clientFollowup.neutrals += lastElem.neutrals;
              clientFollowup.detractors += lastElem.detractors;
    
              clientFollowup.followupPromoters += lastElem.followupPromoters;
              clientFollowup.followupNeutrals += lastElem.followupNeutrals;
              clientFollowup.followupDetractors += lastElem.followupDetractors;
    
            }
    
          });
    
          clientFollowup.promoterPercent = ((clientFollowup.followupPromoters / (clientFollowup.promoters || 1)) * 100).toFixed();
          clientFollowup.neutralsPercent = ((clientFollowup.followupNeutrals / (clientFollowup.neutrals || 1)) * 100).toFixed();
          clientFollowup.detractorsPercent = ((clientFollowup.followupDetractors / (clientFollowup.detractors || 1)) * 100).toFixed();
    
          this.dashboardData.clientFollowup = clientFollowup;
          
    
        },
    
        prepareConsolidatedNPSData: (staffResponses: Array<any>) => {
          let promoters = 0;
          let neutrals = 0;
          let detractors = 0;
          const teamNPS = [];
          let responses = _.cloneDeep(staffResponses);
    
          // Reset
          this.dashboardData.consolidatedNPS.hasData = false;
          this.dashboardData.consolidatedNPS.nps = 0;
    
          // If personal data, then filter
          if (this.dashboardData.consolidatedNPS.type === 'PERSONAL') {
            responses = responses.filter((r) => {
              return (
                r.drlName.toLowerCase() ===
                `${this.appStateService.loggedUser.firstName} ${this.appStateService.loggedUser.lastName}`.toLowerCase()
              );
            });
          }
    
          if (responses.length > 0) {
            this.dashboardData.consolidatedNPS.hasData = true;
          } else {
            return;
          }
    
          responses.forEach((element) => {
            promoters += element.promoters;
            detractors += element.detractors;
            neutrals += element.neutrals;
          });
    
          this.dashboardData.consolidatedNPS.promoters = promoters;
          this.dashboardData.consolidatedNPS.neutrals = neutrals;
          this.dashboardData.consolidatedNPS.detractors = detractors;
    
          this.dashboardData.consolidatedNPS.nps =
            Math.round((promoters * 100) / ((promoters + neutrals + detractors) || 1)) -
            Math.round((detractors * 100) / ((promoters + neutrals + detractors) || 1));
        },
    
        prepareClientScoreData: (staffResponses: Array<any>, orgResponses: Array<any>) => {
          
          let count = 0;
          let scoreTotal = 0;
          let teamNPS = [];
          
          staffResponses = [...staffResponses].reverse();
    
          staffResponses.forEach((element) => {
            const i = _.findIndex(teamNPS, function (el: any) {
              return el.yearMonth === element.year + element.month;
            });
    
            if (i === -1) {
              teamNPS.push({
                yearMonth: element.year + element.month,
                date: moment(element.year + element.month, 'YYYYM').format(
                  'MMM YYYY'
                ),
                count: element.count,
                countTotal: element.countTotal,
                detractors: element.detractors,
                neutrals: element.neutrals,
                promoters: element.promoters,
                scoreTotal: element.scoreTotal
              });
            } else {
              teamNPS[i].count += element.count;
              teamNPS[i].countTotal += element.countTotal;
              teamNPS[i].detractors += element.detractors;
              teamNPS[i].neutrals += element.neutrals;
              teamNPS[i].promoters += element.promoters;
              teamNPS[i].scoreTotal += element.scoreTotal;
            }
          });
    
          // Staff responses
          teamNPS.forEach((element, i) => {

            // if(moment(`${element.yearMonth}`,'YYYYM').add(consolidatedThreshold,'M') >= moment()) {
              scoreTotal += element.scoreTotal;
              count += element.count;
      
              // Check if latest survey
              if (i === 0) {
                this.dashboardData.clientScore.latestTeamScore = +(Math.round((scoreTotal/(count || 1))*2)/2).toFixed(1);
              }
            // }

            
            
          });
    
          this.dashboardData.clientScore.consolidatedTeamScore = +(Math.round((scoreTotal/(count || 1))*2)/2).toFixed(1);
          // Organisation responses
          count = scoreTotal = 0;
          orgResponses.forEach((element, i) => {

            // if(moment(`${element.year}${element.month}`,'YYYYM').add(consolidatedThreshold,'M') >= moment()) {
              scoreTotal += element.scoreTotal;
              count += element.count;
      
              // Check if latest survey
              if (i === 0) {
                this.dashboardData.clientScore.latestOrganisationScore = +(Math.round((scoreTotal/(count || 1))*2)/2).toFixed(1);
              }
            // }
            
            
          });
          this.dashboardData.clientScore.consolidatedOrganisationScore = +(Math.round((scoreTotal/(count || 1))*2)/2).toFixed(1);
          // Force changes
          this.dashboardData.clientScore = { ...this.dashboardData.clientScore };
          
        },
    
        //#region Insights panel data
        prepareInsightsPanel: (responses: Array<any>) => {
          let results: Array<any> = [];
          this.dashboardData.insightsPanel.results = [];
          this.dashboardData.insightsPanel.hasData = !! responses.length;
          
          // responses = responses.filter((element)=>moment(`${element.year}${element.month}`,'YYYYM').add(consolidatedThreshold,'M') >= moment()); 
          
          responses.forEach((element) =>{
    
            element.groupCol = element.groupCol ? element.groupCol : 'None';
    
            const i = _.findIndex(results, function (el: any) {
              return el.groupCol === element.groupCol;
            });
    
            if (i === -1) {
              results.push({
                groupCol: element.groupCol,
                data: [
                  {
                    yearMonth: element.year + element.month,
                    formattedDate: moment(
                      element.year + element.month,
                      'YYYYM'
                    ).format('MMM YYYY'),
                    count: element.count,
                    countTotal: element.countTotal,
                    detractors: element.detractors,
                    neutrals: element.neutrals,
                    promoters: element.promoters,
                    scoreTotal: element.scoreTotal,
                    nps:
                      element.promoters + element.detractors + element.neutrals > 0 ?
                      Math.round(
                        (element.promoters * 100) /
                          (((element.promoters +
                            element.neutrals +
                            element.detractors)) || 1)
                      ) -
                      Math.round(
                        (element.detractors * 100) /
                          (((element.promoters +
                            element.neutrals +
                            element.detractors)) || 1)
                      ) : '-',
    
                  responseRate: (element.count/(element.countTotal||1))*100
                  }
                ]
              });
            } else {
              results[i].data.push({
                yearMonth: element.year + element.month,
                formattedDate: moment(element.year + element.month, 'YYYYM').format(
                  'MMM YYYY'
                ),
                count: element.count,
                countTotal: element.countTotal,
                detractors: element.detractors,
                neutrals: element.neutrals,
                promoters: element.promoters,
                scoreTotal: element.scoreTotal,
                nps:
                    element.promoters + element.detractors + element.neutrals > 0 ?
                    Math.round(
                      (element.promoters * 100) /
                        (((element.promoters +
                          element.neutrals +
                          element.detractors)) || 1)
                    ) -
                    Math.round(
                      (element.detractors * 100) /
                        (((element.promoters +
                          element.neutrals +
                          element.detractors)) || 1)
                    ) : '-',
    
                  responseRate: (element.count/(element.countTotal||1))*100
              });
            }
    
          });
    
          // Calculate summaries and comparison
          
          results.forEach(element => {
    
            let promoterCount = 0;
            let neutralCount = 0;
            let detractorCount = 0;
            let count = 0;
            let countTotal = 0;
    
            element.data = element.data.reverse();
    
            element.lastNPS = element.data[0].nps;
            element.lastResponseRate = element.data[0].responseRate;
            element.lastSurveyDate = element.data[0].formattedDate;
            
            if(element.data.length > 1 && element.data[0].nps !=='-' && element.data[1].nps !== '-') {
              //element.npsChange = ((element.data[0].nps - element.data[1].nps)/(element.data[1].nps||1))*100;
              element.npsChange = (element.data[0].nps - element.data[1].nps);
              element.responseRateChange = element.data[0].responseRate - element.data[1].responseRate;
            } else {
              element.npsChange = 0;
              element.responseRateChange = 0;
            }
    
    
            element.data.forEach(data => {
              promoterCount += data.promoters;
              neutralCount += data.neutrals;
              detractorCount += data.detractors;
              count += data.count;
              countTotal += data.countTotal;
            });
    
            element.consolidatedNPS =  Math.round(
              (promoterCount * 100) /
                (((promoterCount +
                  neutralCount +
                  detractorCount)) || 1)
              ) -
              Math.round(
                (detractorCount * 100) /
                  (((promoterCount +
                    neutralCount +
                    detractorCount)) || 1)
              );
                  
             element.consolidatedResponseRate = (count/(countTotal || 1)) *100;
          });

          console.log('insights results',results);
    
          this.dashboardData.insightsPanel.results = results.sort( function ( a, b ) { return ((b.lastNPS === '-' ? -500 : b.lastNPS ) - (a.lastNPS === '-' ? -500 : a.lastNPS)) || (a.groupCol > b.groupCol ? 1 : -1) } );
    
        }
        //#endregion
    
    };
}
