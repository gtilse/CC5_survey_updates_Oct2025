// Data Models
// models for app data defined as interfaces

// Logged-in user
export interface ILoggedUser {
  objectId: string;
  vendorId: string;
  companyName: string;
  accessLevel: number;
  picture: number;
  username: string;
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  token: string;
}

// Organisation
export interface IOrganisation {
  objectId: string;
  name: string;
  email: string;
  logo: string;
  address: string;
  city: string;
  state: string;
  postCode: string;
  primaryContact: string;
  secondaryContact: string;
  alternateEmail: string;
  phone: string;
  fax: string;
  mobile: string;
}

// User Profile
export interface IUserProfile {
  objectId: string;
  vendorId: string;
  level: number;
  firstName: string;
  middleName: string;
  lastName: string;
  picture: string;
  designation: string;
  department: string;
  phone: string;
  mobile: string;
  userName: string;
  email: string;
  lastSuccessfulLogin: string;
  lastFailedLogin: string;
  loginHistory: string;
  createdAt: string;
  updatedAt: string;
}

// DropList
export interface IDropList {
  objectId: string;
  vendorId: string;
  category: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

// Employee
export interface IEmployee {
  objectId: string;
  vendorId: string;
  active: number;
  parentId: string;
  type: number;
  level: number;
  userOverrideId: string;
  locationId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  userName: string;
  picture: string;
  email: string;
  designation: string;
  department: string;
  phone: string;
  mobile: string;
  locationName: string;
  lastSuccessfulLogin: string;
  lastFailedLogin: string;
  loginHistory: string;
  createdAt: string;
  updatedAt: string;
  staffSurveyOnly?: number;
}

// Employee info
export interface IEmployeeInfo {
  objectId: string;
  vendorId: string;
  active: number;
  type: number;
  level: number;
  firstName: string;
  middleName: string;
  lastName: string;
  userName: string;
  picture: string;
  email: string;
  designation: string;
  department: string;
  phone: string;
  mobile: string;
  parentName: string;
  createdAt: string;
  updatedAt: string;
  nps?: number;
  clientScore?: number;
}

// Location
export interface ILocation {
  objectId: string;
  vendorId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postCode: string;
  createdAt: string;
  updatedAt: string;
}

// Employees/locations select list
export interface IEmployeesLocationsSelectList {
  objectId: string;
  active: number;
  type: number;
  name: string;
}

// Staff select list
export interface IStaffSelectList {
  objectId: string;
  active: number;
  level: number;
  name: string;
}

// Client
export interface IClient {
  objectId: string;
  vendorId: string;
  active: number;
  sendSurveyEmail: number;
  title: string;
  name: string;
  organisation: string;
  email: string;
  code: string;
  yearOfBirth: number;
  address: string;
  phone: string;
  secondaryTitle: string;
  secondaryName: string;
  secondaryPhone: string;
  secondaryEmail: string;
  tertiaryTitle: string;
  tertiaryName: string;
  tertiaryPhone: string;
  tertiaryEmail: string;
  industry: string;
  companySize: string;
  category: string;
  clientGroup: string;
  clientSinceYear: number;
  accountSize: string;
  recommendedByExistingClient: number;
  drl: string;
  drlInclude?: Array<any>;
  drlExclude?: Array<any>;
  transferredFromDrl: string;
  transferredFromDrlDate: string;
  transferredFromDrlReason: string;
  customCategory1?: string;
  customCategory1Desc?: string;
  customCategory2?: string;
  customCategory2Desc?: string;
  customCategory3?: string;
  customCategory3Desc?: string;
  createdAt: string;
  updatedAt: string;
}

// Client score
export interface IClientScore {
  clientId: string;
  name: string;
  email: string;
  score: number;
  comments: string;
  surveyLogId?: string
}

// Client info
export interface IClientInfo {
  objectId: string;
  vendorId: string;
  active: number;
  sendSurveyEmail: number;
  title: string;
  name: string;
  organisation: string;
  email: string;
  code: string;
  yearOfBirth: number;
  address: string;
  phone: string;
  secondaryTitle: string;
  secondaryName: string;
  secondaryPhone: string;
  secondaryEmail: string;
  tertiaryTitle: string;
  tertiaryName: string;
  tertiaryPhone: string;
  tertiaryEmail: string;
  industry: string;
  companySize: string;
  category: string;
  clientGroup: string;
  clientSinceYear: number;
  accountSize: string;
  recommendedByExistingClient: number;
  referredBefore: number;
  drlName: string;
  occupation: string;
  createdAt: string;
  updatedAt: string;
}

// Client Survey
export interface ISurvey {
  objectId: string;
  vendorId: string;
  active: number;
  type: number;
  description: string;
  surveyHtml: string;
  reminderHtml: string;
  emailFrom: string;
  emailSubject: string;
  emailSubjectReminder: string;
  frequency: number;
  splitSend: number;
  addLogo: number;
  newClientsOnly: number;
  reminderDays: number;
  includeDRLS: string[];
  includeCategories: string[];
  additionalQuestions: string[];
  excludeEmployees: string[];
  tags?: string;
  createdAt: string;
  updatedAt: string;
  addHowToImproveQuestion?: number;
  addHowToImproveQuestion2?: number;
  howToImproveQuestionText?: string;
  howToImproveQuestion2Text?: string;
  status?: ISurveyStatus;
  loyaltyDrivers?: string[];
  clientSurveyMonthsLimit?: number;
  customClientCategory1?: string;
  customClientCategory1Desc?: string;
  customization? : { leftScoreLabel: string; rightScoreLabel: string;};
}

// Survey List -- for dropdown lists
export interface ISurveyList {
  objectId: string;
  active: number;
  type: number;
  description: string;
}

// Survey status
export interface ISurveyStatus {
  surveyId: string;
  lastSentOn?: string;
  lastResponseReceivedOn?: string;
  lastSentCount?: number;
  lastResponsesCount?: number;
  allSentCount?: number;
  allResponsesCount?: number;
}

export interface IOrganisationSetting {
  objectId: string;
  vendorId: string;
  surveyEmailFrom: string;
  notificationsEmail: string;
  followupDays: number;
  emailMessageNotification: number;
  googlePage: string;
  facebookPage: string;
  truelocalPage: string;
  displaySocialLinksInSurvey: number;
  automatedEmailSocialMedia: number;
  socialMediaReminderDays: number;
  socialLinksBeforeComments: number;
  testimonialType: number;
  bouncedEmailNotification: number;
  pendingActionItemsNotification: number;
  newResponsesNotification: number;
  clientSurveyLimit: number;
  createdAt: string;
  updatedAt: string;
}

// Action item
export interface IActionItem {
  objectId: string;
  score: number;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientDrlId: string;
  clientDrlName: string;
  comments: string;
  receivedOnDate: string;
  flagged: number;
  note: string;
  followupById: string;
  followupByName: string;
  followupOnDate: string;
  followupComments: string;
}

// Notification
export interface INotification {
  objectId: string;
  date: string;
  notificationType: string;
  description: string;
  linkedId: string;
}

// Loyalty Drivers
export interface ILoyaltyDriver {
  objectId?: string;
  vendorId?: string;
  loyaltyDriverId?: string;
  type: string;
  description: string;
  sortOrder?: number;
  isSelected?: number;
}

// Custom questions
export interface ICustomQuestion {
  objectId: string;
  vendorId?: string;
  customQuestionId?: string;
  heading: string;
  subHeading?: string;
  type: number;
  typeDescription: string;
  sortOrder?: number;
  isSelected?: number;
  customQuestionList?: Array<ICustomQuestionList>;
}

// Custom question list
export interface ICustomQuestionList {
  objectId: string;
  customQuestionId: string;
  description: string;
  weight?: number;
}
