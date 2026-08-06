import { Admin, Resource } from 'react-admin';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';
import { rootsTheme } from './theme';
import Login from './Login';
import { UserList, UserShow } from './resources/users';
import { SubscriptionList } from './resources/subscriptions';
import { SettingList, SettingEdit, SettingCreate } from './resources/settings';
import { SupportList, SupportShow } from './resources/support';

export default function App() {
  return (
    <Admin
      title="Balanced Roots"
      dataProvider={dataProvider}
      authProvider={authProvider}
      loginPage={Login}
      theme={rootsTheme}
      requireAuth
    >
      <Resource name="users" list={UserList} show={UserShow} recordRepresentation="email" />
      <Resource name="subscriptions" list={SubscriptionList} options={{ label: 'Subscriptions' }} />
      <Resource
        name="settings"
        list={SettingList}
        edit={SettingEdit}
        create={SettingCreate}
        recordRepresentation="key"
      />
      <Resource name="support" list={SupportList} show={SupportShow} options={{ label: 'Support' }} />
    </Admin>
  );
}
