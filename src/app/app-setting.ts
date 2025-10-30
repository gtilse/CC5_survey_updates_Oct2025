// Constant definitions for the App
import * as moment from 'moment';
import { AngularCsv } from 'angular-csv-ext/dist/Angular-csv';

import { environment } from '../environments/environment';

const imagesPath = 'assets/images/';

export class APPSHARED {
  public static LOCAL_STORAGE_KEY = 'CLIENT_CULTURE';

  public static API_PATH = environment.apiPath;

  public static CSV_FILE_PROCESS_PATH = environment.csvFileProcessPath;

  public static FILE_UPLOAD_API_PATH = environment.fileUploadAPIPath;

  public static IMAGES_PATH = imagesPath;

  public static APP_LOGO = `${imagesPath}app-logo.png`;

  public static APP_LOGO_WHITE = `${imagesPath}app-logo-white.png`;

  public static EMPTY_PROFILE_PHOTO = `${imagesPath}empty-profile-photo.jpg`;

  public static ORG_LOGO_PLACEHOLDER_PHOTO = `${imagesPath}placeholder-photo-4x3.png`;

  public static APP_DATA_PATH = 'app_data/';

  public static URL_VALIDATION_PATTERN = 'https?://.+';

  public static SURVEY_PREVIEW_URL = `${environment.rootPath}/survey/survey.php`;

  //
  public static RESPONSES_TYPE_SELECT_LIST = [
    { VALUE: 'DATE', DESC: 'Date' },
    { VALUE: 'STAFF', DESC: 'Organisation Staff' },
    { VALUE: 'CLIENT_CATEGORY', DESC: 'Client Category' },
    { VALUE: 'CLIENT_INDUSTRY', DESC: 'Client Industry' }
  ];

  //
  public static NPS_TYPE_SELECT_LIST = [
    { VALUE: 'STAFF', DESC: 'Organisation Staff' },
    { VALUE: 'CLIENT_CATEGORY', DESC: 'Client Category' },
    { VALUE: 'CLIENT_INDUSTRY', DESC: 'Client Industry' }
  ];

  public static APP_FEEDBACK_OPTIONS = [
    'Need help',
    'Improvement suggestion',
    'Other'
  ];

  public static DASHBOARD_CHART = {
    DAILY_RESPONSES: { VALUE: 'DailyResponse', DESC: 'Daily Responses' },
    GROUPS: [
      {
        NAME: 'View Responses By...',
        LIST: [
          { VALUE: 'ClientUserResponse', DESC: 'Organisation Employee' },
          { VALUE: 'ClientCategoryResponse', DESC: 'Client Category' },
          { VALUE: 'ClientSinceReponse', DESC: 'Client Since' },
          { VALUE: 'ClientIndustryResponse', DESC: 'Client Industry' }
        ]
      },

      {
        NAME: 'View NPS By...',
        LIST: [
          { VALUE: 'ClientUserNPS', DESC: 'Organisation Employee' },
          { VALUE: 'ClientCategoryNPS', DESC: 'Client Category' },
          { VALUE: 'ClientSinceNPS', DESC: 'Client Since' },
          { VALUE: 'ClientIndustryNPS', DESC: 'Client Industry' }
        ]
      }
    ]
  };

  public static REPORT_LIST = {
    GROUPS: [
      {
        NAME: 'Organisation',
        LIST: [
          { VALUE: 'ORG_SUMMARY', DESC: 'Summary', SUFFIX: 'Organisation' }
        ],
        ACCESS_LEVEL: 1
      },

      {
        NAME: 'Client Survey',
        LIST: [
          {
            VALUE: 'CLIENT_ALL_RESULTS',
            DESC: 'All Results',
            SUFFIX: 'Client All Survey'
          },
          {
            VALUE: 'CLIENT_SURVEY_STATUS',
            DESC: 'Status',
            SUFFIX: 'Client Survey'
          },
          {
            VALUE: 'CLIENT_RESPONDERS',
            DESC: 'Responders',
            SUFFIX: 'Client Survey'
          },
          {
            VALUE: 'CLIENT_ACTION_ITEMS',
            DESC: 'Follow-up Items',
            SUFFIX: 'Client Survey'
          },
          {
            VALUE: 'CLIENT_NON_RESPONDERS',
            DESC: 'Non Responders',
            SUFFIX: 'Client Survey'
          }
        ],
        ACCESS_LEVEL: 2
      },

      {
        NAME: 'Client Satisfaction by',
        LIST: [
          {
            VALUE: 'SATISFACTION_STAFF',
            DESC: 'Staff',
            SUFFIX: 'Client Satisfaction'
          },
          {
            VALUE: 'SATISFACTION_CATEGORY',
            DESC: 'Category',
            SUFFIX: 'Client Satisfaction'
          },
          {
            VALUE: 'SATISFACTION_INDUSTRY',
            DESC: 'Industry',
            SUFFIX: 'Client Satisfaction'
          }
        ],
        ACCESS_LEVEL: 2
      },

      {
        NAME: 'Staff Survey',
        LIST: [
          {
            VALUE: 'STAFF_SURVEY_STATUS',
            DESC: 'Status',
            SUFFIX: 'Staff Survey'
          },
          {
            VALUE: 'STAFF_RESPONDERS',
            DESC: 'Responders',
            SUFFIX: 'Staff Survey'
          }
        ],
        ACCESS_LEVEL: 1
      },

      {
        NAME: 'Pulse Survey',
        LIST: [
          {
            VALUE: 'PULSE_SURVEY_STATUS',
            DESC: 'Status',
            SUFFIX: 'Pulse Survey'
          },
          {
            VALUE: 'PULSE_RESPONDERS',
            DESC: 'Responders',
            SUFFIX: 'Pulse Survey'
          }
        ],
        ACCESS_LEVEL: 2
      },

      {
        NAME: 'Manager Survey',
        LIST: [
          {
            VALUE: 'MANAGER_SURVEY_STATUS',
            DESC: 'Status',
            SUFFIX: 'Manager Survey'
          },
          {
            VALUE: 'MANAGER_RESPONDERS',
            DESC: 'Responders',
            SUFFIX: 'Manager Survey'
          }
        ],
        ACCESS_LEVEL: 1
      }
    ]
  };

  public static COLORS = {
    PROMOTER: '#47c598',
    NEUTRAL: '#EEEEEE',
    DETRACTOR: '#F01257',
    PRIMARY: '#3d5afe',
    MUTED: '#9b9b9b'
  };

  public static CHART_OPTIONS = {
    RESPONSES_BREAKDOWN: {
      colorScheme: {
        domain: [
          APPSHARED.COLORS.PROMOTER,
          APPSHARED.COLORS.NEUTRAL,
          APPSHARED.COLORS.DETRACTOR
        ]
      },
      gradient: false,
      xAxis: true,
      yAxis: true,
      showXAxis: true,
      showYAxis: true,
      showXAxisLabel: false,
      showYAxisLabel: true,
      xAxisLabel: '',
      yAxisLabel: 'Responses',
      autoScale: true,
      barPadding: 24,

      axisDigits: (val: any): any => {
        return val % 1 === 0 ? parseInt(val) : '';
      }
    },

    NPS_BREAKDOWN: {
      colorScheme: {
        domain: [APPSHARED.COLORS.PROMOTER]
      },
      gradient: false,
      xAxis: true,
      yAxis: true,
      showXAxis: true,
      showYAxis: true,
      showXAxisLabel: false,
      showYAxisLabel: true,
      xAxisLabel: '',
      yAxisLabel: 'Net Promoter Score',
      autoScale: true,
      barPadding: 24,
      yScaleMin: -100,
      yScaleMax: 100,

      axisDigits: (val: any): any => {
        return val % 1 === 0 ? parseInt(val) : '';
      }
    },

    RESPONSE_RATE: {
      colorScheme: {
        domain: [APPSHARED.COLORS.PROMOTER]
      },
      gradient: true,
      xAxis: true,
      yAxis: true,
      showXAxis: true,
      showYAxis: true,
      showXAxisLabel: false,
      showYAxisLabel: true,
      xAxisLabel: '',
      yAxisLabel: 'Response Rate',
      autoScale: true,
      barPadding: 24,
      yScaleMin: 0,
      yScaleMax: 100,

      axisDigits: (val: any): any => {
        return val % 1 === 0 ? `${parseInt(val)}%` : '';
      }
    },

    SCORE_BREAKDOWN: {
      colorScheme: {
        domain: [
          APPSHARED.COLORS.DETRACTOR,
          APPSHARED.COLORS.DETRACTOR,
          APPSHARED.COLORS.DETRACTOR,
          APPSHARED.COLORS.DETRACTOR,
          APPSHARED.COLORS.DETRACTOR,
          APPSHARED.COLORS.DETRACTOR,
          APPSHARED.COLORS.DETRACTOR,
          APPSHARED.COLORS.NEUTRAL,
          APPSHARED.COLORS.NEUTRAL,
          APPSHARED.COLORS.PROMOTER,
          APPSHARED.COLORS.PROMOTER
        ]
      },
      gradient: false,
      xAxis: true,
      yAxis: true,
      showXAxis: true,
      showYAxis: true,
      showXAxisLabel: true,
      showYAxisLabel: true,
      xAxisLabel: '',
      yAxisLabel: 'Responses',
      autoScale: true,
      barPadding: 48,

      axisDigits: (val: any): any => {
        return val % 1 === 0 && val != 0 ? parseInt(val) : '';
      }
    },

    SCORE_CATEGORY: {
      colorScheme: {
        domain: [
          APPSHARED.COLORS.PROMOTER,
          APPSHARED.COLORS.NEUTRAL,
          APPSHARED.COLORS.DETRACTOR
        ]
      },
      gradient: false,
      xAxis: true,
      yAxis: true,
      showXAxis: false,
      showYAxis: true,
      showXAxisLabel: false,
      showYAxisLabel: true,
      xAxisLabel: '',
      yAxisLabel: 'Totals',
      autoScale: true,
      barPadding: 14
    },

    CLIENT_SCORE: {
      colorScheme: {
        domain: [APPSHARED.COLORS.PROMOTER]
      },

      min: 0,
      max: 10,
      bigSegments: 10,
      smallSegments: 2
    }
  };

  public static DROPLIST = {
    DEPARTMENT: { VALUE: 'Department', DESC: 'Department' },
    DESIGNATION: { VALUE: 'Designation', DESC: 'Designation' },
    CLIENT_CATEGORY: { VALUE: 'Client Category', DESC: 'Client Category' },
    CLIENT_INDUSTRY: { VALUE: 'Client Industry', DESC: 'Client Industry' },
    CITY: { VALUE: 'City', DESC: 'City' },
    STATE: { VALUE: 'State', DESC: 'State' },
    POST_CODE: { VALUE: 'PostCode', DESC: 'Post Code' }
  };

  public static USER_LEVEL = {
    ADMIN: { VALUE: 1, DESC: 'Administrator' },
    MEMBER: { VALUE: 2, DESC: 'Member' }
  };

  public static EMPLOYEE_TYPE = {
    EMPLOYEE: { VALUE: 0, DESC: 'Employee' },
    LOCATION: { VALUE: 1, DESC: 'Location' }
  };

  public static RECORD_STATE = {
    INACTIVE: { VALUE: 0, DESC: 'Inactive' },
    ACTIVE: { VALUE: 1, DESC: 'Active' }
  };

  public static SURVEY_TYPE = {
    "CLIENT": {"VALUE": 0, "DESC": "Client"},
    "STAFF": {"VALUE": 1, "DESC": "Staff"},
    "PULSE": {"VALUE": 2, "DESC": "Pulse"},
    "MANAGER": {"VALUE": 3, "DESC": "Manager"},
    "TRIAGE": {"VALUE": 4, "DESC": "Triage"},
    "PROJECT": {"VALUE": 5, "DESC": "Project"}
  }

  public static SURVEY_FREQUENCY = {
    ONCE: { VALUE: 0, DESC: 'Once' },
    MONTHLY: { VALUE: 1, DESC: 'Monthly' },
    QUARTERLY: { VALUE: 2, DESC: 'Quarterly' },
    HALF_YEARLY: { VALUE: 3, DESC: 'Half Yearly' },
    YEARLY: { VALUE: 4, DESC: 'Yearly' }
  };

  public static SURVEY_SPLIT_SEND = {
    COMPLETE_LIST: { VALUE: 0, DESC: 'Complete List' },
    ONE_TENTH: { VALUE: 10, DESC: 'One Tenth' },
    ONE_FIFTH: { VALUE: 20, DESC: 'One Fifth' },
    ONE_FOURTH: { VALUE: 25, DESC: 'One Fourth' },
    ONE_THIRD: { VALUE: 33, DESC: 'One Third' },
    ONE_HALF: { VALUE: 50, DESC: 'One Half' }
  };

  public static SURVEY_DEFAULTS = {
    "EMAIL_SUBJECT": "One quick question",
    "REMINDER_SUBJECT": "Reminder - One quick question",

    "EMAIL_SUBJECT_PULSE": "Pulse Survey",
    "REMINDER_SUBJECT_PULSE": "Reminder - Pulse Survey",

    "EMAIL_SUBJECT_MANAGER": "Manager Survey",
    "REMINDER_SUBJECT_MANAGER": "Reminder - Manager Survey",

    "EMAIL_SUBJECT_TRIAGE": "COVID-19 Survey",
    "REMINDER_SUBJECT_TRIAGE": "Reminder - COVID-19 Survey",

    "EMAIL_TEXT": "<p><strong>Dear {{CLIENTNAME}}</strong></p><p>{{CLIENTCONTACT}} would like to ask one question.</p><p>How likely are you to recommend {{FIRMNAME}} to a friend or colleague?</p><p>Please choose a number below.</p>",
    "REMINDER_TEXT": "<p><strong>Dear {{CLIENTNAME}}</strong></p><p>We'd really appreciate if you could take a moment to answer a simple question.</p><p>How likely are you to recommend us to a friend or colleague?</p><p>Please choose a number below.</p>",

    "EMAIL_TEXT_STAFF": "<p><strong>Dear {{STAFFNAME}}</strong></p><p>We would like to ask one question.</p><p>How likely are you to recommend {{FIRMNAME}} to a friend or colleague?</p><p>Please choose a number below.</p>",
    "REMINDER_TEXT_STAFF": "<p><strong>Dear {{STAFFNAME}}</strong></p><p>We'd really appreciate if you could take a moment to answer a simple question.</p><p>How likely are you to recommend us to a friend or colleague?</p><p>Please choose a number below.</p>",

    "EMAIL_TEXT_PULSE": "<p><strong>Dear {{CLIENTNAME}}</strong></p><p>To help us continue to improve our services, please click the button below to complete a short question survey.</p>",
    "EMAIL_TEXT_MANAGER": "<p>To help us continue to improve your work environment please click on the button below to complete a short question survey about your manager or managers.</p>",

    "EMAIL_TEXT_TRIAGE": "<p><strong>Dear {{CLIENTNAME}}</strong></p><p>How seriously is your business being negatively impacted at present?</p>",

    "IMPROVEMENT_QUESTION": "What improvement would you like to see us make?",
    "IMPROVEMENT_QUESTION2": "Anything else you would like to add"
  }

  // Email status
  public static EMAIL_STATUS = [
    'Pending',
    'Sent',
    'Delivered',
    'Hard Bounce',
    'Soft Bounce'
  ];

  // Date range selection
  public static DATE_RANGES = [
    { DESC: 'One Month', VALUE: 30 },
    { DESC: 'Three Months', VALUE: 90 },
    { DESC: 'Six Months', VALUE: 180 },
    { DESC: 'One Year', VALUE: 365 }
  ];

  // Score type selection
  public static SCORE_TYPES = [
    { DESC: 'Promoters', VALUE: 'PROMOTER' },
    { DESC: 'Neutrals', VALUE: 'NEUTRAL' },
    { DESC: 'Detractors', VALUE: 'DETRACTOR' }
  ];

  public static FOLLOWUP = [
    { DESC: 'To-do', VALUE: 'TODO' },
    { DESC: 'Followed-up', VALUE: 'FOLLOWEDUP' }
  ];

  // Flagged selection
  public static FLAG_TYPES = [
    { DESC: 'Flagged', VALUE: 'FLAGGED' },
    { DESC: 'Not Flagged', VALUE: 'NOT_FLAGGED' }
  ];

  // Client survey limit
  public static CLIENT_SURVEY_LIMIT = [
    { DESC: 'No Limit', VALUE: 0 },
    { DESC: 'One month', VALUE: 1 },
    { DESC: 'Two months', VALUE: 2 },
    { DESC: 'Three months', VALUE: 3 },
    { DESC: 'Four months', VALUE: 4 },
    { DESC: 'Five months', VALUE: 5 },
    { DESC: 'Six months', VALUE: 6 }
  ];

  // Client field mappings
  public static CLIENT_FIELDS_MAPPING = [
    { fieldName: 'title', description: 'Title' },
    { fieldName: 'name', description: 'Client Name' },
    { fieldName: 'secondaryName', description: 'Other Contact Person' },
    { fieldName: 'email', description: 'Email' },
    { fieldName: 'yearOfBirth', description: 'Year of Birth' },
    { fieldName: 'phone', description: 'Phone' },
    { fieldName: 'organisation', description: 'Organisation' },
    { fieldName: 'code', description: 'Client Code' },
    { fieldName: 'accountSize', description: 'Account Size' },
    { fieldName: 'industry', description: 'Industry' },
    { fieldName: 'category', description: 'Client Value' },
    { fieldName: 'clientGroup', description: 'Client Group' },
    { fieldName: 'clientSinceYear', description: 'Client Since' },
    { fieldName: 'referredBefore', description: 'Referred Before' },
    { fieldName: 'frequencyOfReview', description: 'Frequency of Review' },
    { fieldName: 'drl', description: 'Client Contact' },
    { fieldName: 'drlInclude', description: 'Secondary Client Contact' },
    { fieldName: 'tags', description: 'Tags' }
  ];

  // Titles
  public static TITLES = ['Mr', 'Mrs', 'Ms', 'Dr'];

  // Client Value
  public static CLIENT_VALUATIONS = [
    'No Fee',
    'Bronze',
    'Silver',
    'Gold',
    'Platinum'
  ];

  // Client checkin
  public static CLIENT_CHECKIN = [
    { DESC: 'Every month', VALUE: 1 },
    { DESC: 'Every 2 months', VALUE: 2 },
    { DESC: 'Every 3 months', VALUE: 3 },
    { DESC: 'Every 6 months', VALUE: 6 },
    { DESC: 'Every 12 months', VALUE: 12 }
  ];

  // Survey Schedule
  public static SURVEY_SCHEDULE = [
    { DESC: 'Every month', VALUE: 1 },
    { DESC: 'Every 2 months', VALUE: 2 },
    { DESC: 'Every 3 months', VALUE: 3 },
    { DESC: 'Every 4 months', VALUE: 4 },
    { DESC: 'Every 6 months', VALUE: 6 },
    { DESC: 'Every 12 months', VALUE: 12 },
    { DESC: 'Custom', VALUE: 0 }
  ];

  // Vendor Level
  public static VENDOR_LEVEL = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

  // Account Size
  public static ACCOUNT_SIZES = ['Small', 'Medium', 'Large'];

  // Company Size
  public static COMPANY_SIZES = ['Small', 'Medium', 'Large'];

  // Frequency of review
  public static FREQUENCY_OF_REVIEW = [
    'Monthly',
    'Quaterly',
    'Half Yearly',
    'Yearly',
    'Biennial'
  ];

  // Client data conversion/mapping
  public static CLIENT_CATEGORY_SORT = {
    Platinum: 0,
    Gold: 1,
    Silver: 2,
    Bronze: 3,
    'No Fee': 4
  };

  public static CLIENT_SINCE_CONVERSION = {
    1: '<1 Year',
    2: '<3 Years',
    3: '<5 Years',
    4: '>5 Years'
  };

  public static CLIENT_SINCE_SORT = {
    '<1 Year': 0,
    '<3 Years': 1,
    '<5 Years': 2,
    '>5 Years': 3
  };

  // Async dialog actions
  public static ASYNC_DIALOG_ACTIONS = {
    DELETE: 1,
    DEACTIVATE: 2,
    UPLOAD_CLIENTS: 3,
    QUEUE_CLIENT_SURVEY: 4,
    QUEUE_EMPLOYEE_SURVEY: 5,
    UNDO_RESOLVED_ACTION_ITEM: 6,
    REMOVE_LOGIN: 7,
    DELETE_SINGLE_RECORD: 8
  };

  // App notification types
  public static APP_NOTIFICATION_TYPES = {
    CLIENT_SURVEY_QUEUED: 'Client survey queued',
    CLIENT_REMINDER_SENT: 'Client survey reminder sent',
    STAFF_SURVEY_QUEUED: 'Staff survey queued',
    CLIENT_EMAIL_BOUNCED: 'Client email bounced',
    ACTION_ITEM: 'Action Items',
    LOGIN_SUCCESS: 'Login success',
    LOGIN_SUCCESS_SSO: 'Login success (SSO)',
    LOGIN_FAILED: 'Login Failed'
  };

  // Score type
  public static scoreType = {
    isPromoter(score: number) {
      return score > 8;
    },

    isNeutral(score: number) {
      return !!(score > 6 && score <= 8);
    },

    isDetractor(score: number) {
      return score <= 6;
    }
  };

  // Toolbar configuration for email/reminder
  public static EMAIL_CONTENT_EDITOR_CONFIG = {
    toolbar: [
      'bold',
      'italic',
      'heading',
      '|',
      'unordered-list',
      'ordered-list',
      '|',
      'link',
      '|',
      'preview',
      '|',
      'guide'
    ]
  };

  /**
   * Common functions shared for use by other components and services
   */

  // Return list of current year till 1950
  public static yearSelectionList(): Array<number> {
    const startYear = moment().year();
    const yearList: Array<number> = [];
    for (let i = startYear; i >= 1950; i--) {
      yearList.push(i);
    }

    return yearList;
  }

  // Reminder days select list
  public static reminderDaysSelectionList(): Array<number> {
    const reminderList: Array<number> = [];
    for (let i = 2; i <= 14; i++) {
      reminderList.push(i);
    }

    return reminderList;
  }

  // Return 1-12
  public static monthsSelectionList(): Array<number> {
    const monthsList: Array<number> = [];
    for (let i = 1; i <= 12; i++) {
      monthsList.push(i);
    }

    return monthsList;
  }

  // Client since description
  public static getClientSinceDescription(clientSinceYear): string {
    clientSinceYear = parseInt(clientSinceYear);
    if (!clientSinceYear) return null;
    const currentYear = moment().year();
    let retString = '';

    switch (currentYear - clientSinceYear) {
      case 0:
      case 1:
        retString = this.CLIENT_SINCE_CONVERSION[1];
        break;

      case 2:
      case 3:
        retString = this.CLIENT_SINCE_CONVERSION[2];
      case 4:
      case 5:
        retString = this.CLIENT_SINCE_CONVERSION[3];
      default:
        retString = this.CLIENT_SINCE_CONVERSION[4];
    }
  }

  // Get text size for D3 chart
  // public static textSize(text: string, fontSize: number = 12) {
  //   if (!d3) return;
  //   const container = d3.select('body').append('svg');
  //   container
  //     .append('text')
  //     .attr('x', -9999)
  //     .attr('y', -9999)
  //     .style('font-size', fontSize)
  //     .text(text);
  //   const size = container.node().getBBox();
  //   container.remove();
  //   return { width: size.width, height: size.height };
  // }

  // Calculate NPS and Client scores from responses array
  public static calculateScoresFromResponses(responses: Array<any>) {
    let [count, promoters, neutrals, detractors, scoreTotal] = Array(5).fill(0);
    let [nps, clientScore] = [null, null];

    responses = responses.filter((o) => typeof o.score === 'number');
    if (responses.length === 0) {
      return [nps, clientScore];
    }

    responses.forEach((o) => {
      count++;
      scoreTotal += o.score;
      if (this.scoreType.isPromoter(o.score)) {
        promoters++;
      } else if (this.scoreType.isDetractor(o.score)) {
        detractors++;
      } else {
        neutrals++;
      }
    });

    nps =
      Math.round((promoters * 100) / (promoters + neutrals + detractors)) -
      Math.round((detractors * 100) / (promoters + neutrals + detractors));

    clientScore = Math.round((scoreTotal / count) * 2) / 2;
    return [nps, clientScore];
  }

  // Switch TYPE and VALUE keys
  // { 'TYPE': {'VALUE':  <value> , 'DESC': <desc> }} ==> { 'VALUE': {'TYPE': <type>, 'DESC': <desc> }}
  public static switchTypeKeyToValue(obj: any) {
    const valueObject = {};
    Object.keys(obj).forEach((key) => {
      // Note: object keys cannot be numeric
      // will not be able to use dot operator to access object value, however obj[key] is fine
      valueObject[obj[key].VALUE] = { KEY: key, DESC: obj[key].DESC };
    });

    return valueObject;
  }

  // Create array from CSV list
  public static csvToArray(text) {
    let p = '';
    let row = [''];
    const ret = [row];
    let i = 0;
    let r = 0;
    let s = !0;
    let l;
    for (l of text) {
      if (l === '"') {
        if (s && l === p) row[i] += l;
        s = !s;
      } else if (l === ',' && s) l = row[++i] = '';
      else if (l === '\n' && s) {
        if (p === '\r') row[i] = row[i].slice(0, -1);
        row = ret[++r] = [(l = '')];
        i = 0;
      } else row[i] += l;
      p = l;
    }
    return ret;
  }

  // Check if valid name
  public static isValidName(name: string) {
    return /^[A-Za-z]+((\s)?((\'|\-|\.)?([A-Za-z])+))*$/.test(name);
  }

  // Check if valid email address
  public static isValidEmail(email: string) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  // Get description from custom list object
  public static getDescriptionFromValue(o: any, val: any) {
    let desc = '';
    for (const prop in o) {
      if (o[prop].VALUE === val) {
        desc = o[prop].DESC;
      }
    }

    return desc;
  }

  // Export to CSV
  public static exportToCsv(data: Array<any>, fileName: string) {
    new AngularCsv(data, fileName, {
      showLabels: true,
      nullToEmptyString: true,
      headers: Object.keys(data[0])
    });
  }
}
