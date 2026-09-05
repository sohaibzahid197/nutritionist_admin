import { Admin, Resource } from 'react-admin';

/**
 * One icon per resource, imported individually rather than from the barrel so
 * the bundle carries eighteen glyphs instead of the whole set.
 *
 * Without an `icon` prop react-admin falls back to the same default for every
 * entry, which is what the sidebar was: eighteen identical rows that had to be
 * read word by word. The icons are chosen for what the thing *is* — a plate for
 * recipes, a calendar for programmes, a receipt for subscriptions — so the
 * shape is findable before the label is.
 */
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import ReceiptIcon from '@mui/icons-material/ReceiptLongOutlined';
import CampaignIcon from '@mui/icons-material/CampaignOutlined';
import SellIcon from '@mui/icons-material/SellOutlined';
import RestaurantIcon from '@mui/icons-material/RestaurantOutlined';
import ComboIcon from '@mui/icons-material/DinnerDiningOutlined';
import CalendarIcon from '@mui/icons-material/CalendarMonthOutlined';
import EggIcon from '@mui/icons-material/EggAltOutlined';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import SpaIcon from '@mui/icons-material/SpaOutlined';
import SoupIcon from '@mui/icons-material/SoupKitchenOutlined';
import TagIcon from '@mui/icons-material/LocalOfferOutlined';
import ArticleIcon from '@mui/icons-material/MenuBookOutlined';
import SettingsIcon from '@mui/icons-material/TuneOutlined';
import SupportIcon from '@mui/icons-material/SupportAgentOutlined';
import FlagIcon from '@mui/icons-material/FlagOutlined';
import DeleteIcon from '@mui/icons-material/PersonRemoveOutlined';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';
import { rootsTheme } from './theme';
import Login from './Login';
import Dashboard from './Dashboard';
import { UserList, UserShow } from './resources/users';
import { SubscriptionList } from './resources/subscriptions';
import { SettingList, SettingEdit, SettingCreate } from './resources/settings';
import { SupportList, SupportShow } from './resources/support';
import { DeleteRequestList, ReportList } from './resources/moderation';
import { ArticleList, ArticleEdit, ArticleCreate } from './resources/articles';
import { RecipeList, RecipeEdit, RecipeCreate } from './resources/recipes';
import { ComboList, ComboEdit, ComboCreate, ProgramList, ProgramEdit, ProgramCreate } from './resources/programs';
import { PlanList, PlanEdit, PlanCreate } from './resources/plans';
import { NotificationSend } from './resources/notifications';
import {
  CategoryCreate,
  CategoryEdit,
  CategoryList,
  IngredientCreate,
  IngredientEdit,
  IngredientList,
  MealTypeCreate,
  MealTypeEdit,
  MealTypeList,
  SimpleNameCreate,
  SimpleNameEdit,
  SimpleNameList,
} from './resources/catalog';

export default function App() {
  return (
    <Admin
      title="BiteSet"
      dataProvider={dataProvider}
      authProvider={authProvider}
      loginPage={Login}
      dashboard={Dashboard}
      theme={rootsTheme}
      requireAuth
    >
      <Resource name="users" icon={PeopleIcon} list={UserList} show={UserShow} recordRepresentation="email" />
      <Resource name="subscriptions" icon={ReceiptIcon} list={SubscriptionList} options={{ label: 'Subscriptions' }} />
      {/* Not a CRUD resource — the send form and its history are one screen. */}
      <Resource name="notifications" icon={CampaignIcon} list={NotificationSend} options={{ label: 'Notifications' }} />
      <Resource name="plans" icon={SellIcon} list={PlanList} edit={PlanEdit} create={PlanCreate} recordRepresentation="name" />

      <Resource
        name="recipes"
        icon={RestaurantIcon}
        list={RecipeList}
        edit={RecipeEdit}
        create={RecipeCreate}
        recordRepresentation="name"
      />
      <Resource
        name="combos"
        icon={ComboIcon}
        list={ComboList}
        edit={ComboEdit}
        create={ComboCreate}
        recordRepresentation="name"
        options={{ label: 'Combos' }}
      />
      <Resource
        name="programs"
        icon={CalendarIcon}
        list={ProgramList}
        edit={ProgramEdit}
        create={ProgramCreate}
        recordRepresentation="name"
        options={{ label: 'Programmes' }}
      />

      <Resource
        name="ingredients"
        icon={EggIcon}
        list={IngredientList}
        edit={IngredientEdit}
        create={IngredientCreate}
        recordRepresentation="name"
      />
      <Resource
        name="ingredient-categories"
        icon={CategoryIcon}
        list={CategoryList}
        edit={CategoryEdit}
        create={CategoryCreate}
        recordRepresentation="name"
        options={{ label: 'Ingredient categories' }}
      />
      <Resource
        name="meal-types"
        icon={ScheduleIcon}
        list={MealTypeList}
        edit={MealTypeEdit}
        create={MealTypeCreate}
        recordRepresentation="name"
        options={{ label: 'Meal types' }}
      />
      <Resource
        name="diet-preferences"
        icon={SpaIcon}
        list={SimpleNameList}
        edit={SimpleNameEdit}
        create={SimpleNameCreate}
        recordRepresentation="name"
        options={{ label: 'Diet preferences' }}
      />
      <Resource
        name="cooking-styles"
        icon={SoupIcon}
        list={SimpleNameList}
        edit={SimpleNameEdit}
        create={SimpleNameCreate}
        recordRepresentation="name"
        options={{ label: 'Cooking styles' }}
      />
      <Resource
        name="post-tags"
        icon={TagIcon}
        list={SimpleNameList}
        edit={SimpleNameEdit}
        create={SimpleNameCreate}
        recordRepresentation="name"
        options={{ label: 'Post tags' }}
      />

      <Resource
        name="articles"
        icon={ArticleIcon}
        list={ArticleList}
        edit={ArticleEdit}
        create={ArticleCreate}
        recordRepresentation="title"
        options={{ label: 'Learn articles' }}
      />

      <Resource
        name="settings"
        icon={SettingsIcon}
        list={SettingList}
        edit={SettingEdit}
        create={SettingCreate}
        recordRepresentation="key"
      />
      <Resource name="support" icon={SupportIcon} list={SupportList} show={SupportShow} options={{ label: 'Support' }} />

      {/* Both queues are legal/marketplace obligations, not conveniences:
          reports is Apple's UGC moderation requirement, delete-requests is GDPR. */}
      <Resource name="reports" icon={FlagIcon} list={ReportList} options={{ label: 'Reported posts' }} />
      <Resource
        name="delete-requests"
        icon={DeleteIcon}
        list={DeleteRequestList}
        options={{ label: 'Deletion requests' }}
      />
    </Admin>
  );
}
