// App navigation
// Links for left nav
export const APP_NAV = [
  { route: 'dashboard', icon: 'home', text: 'Dashboard', accessRights: 1 },
  { route: 'feedback', icon: 'message', text: 'Feedback', accessRights: 1 },
  {
    route: 'actionitems',
    icon: 'phone_in_talk',
    text: 'Follow-up',
    accessRights: 1
  },
  { route: 'client', icon: 'people', text: 'Clients', accessRights: 1 },
  { route: 'reports', icon: 'bar_chart', text: 'Reports', accessRights: 1 },
  { type: 'SEPARATOR', accessRights: 0 },
  { type: 'HEADING', text: 'Admin', accessRights: 0 },
  {
    route: 'organisation',
    icon: 'business',
    text: 'Organisation',
    accessRights: 0
  },
  { route: 'location', icon: 'directions', text: 'Locations', accessRights: 0 },
  { route: 'staff', icon: 'assignment_ind', text: 'Staff', accessRights: 0 },
  { route: 'survey', icon: 'contact_mail', text: 'Survey', accessRights: 0 },
  { route: 'droplist', icon: 'list', text: 'Drop list', accessRights: 0 },
  { route: 'setting', icon: 'build', text: 'Settings', accessRights: 0 }
];
