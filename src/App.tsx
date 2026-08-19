import { Admin, Resource } from 'react-admin';
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
      <Resource name="users" list={UserList} show={UserShow} recordRepresentation="email" />
      <Resource name="subscriptions" list={SubscriptionList} options={{ label: 'Subscriptions' }} />
      <Resource name="plans" list={PlanList} edit={PlanEdit} create={PlanCreate} recordRepresentation="name" />

      <Resource
        name="recipes"
        list={RecipeList}
        edit={RecipeEdit}
        create={RecipeCreate}
        recordRepresentation="name"
      />
      <Resource
        name="combos"
        list={ComboList}
        edit={ComboEdit}
        create={ComboCreate}
        recordRepresentation="name"
        options={{ label: 'Combos' }}
      />
      <Resource
        name="programs"
        list={ProgramList}
        edit={ProgramEdit}
        create={ProgramCreate}
        recordRepresentation="name"
        options={{ label: 'Programmes' }}
      />

      <Resource
        name="ingredients"
        list={IngredientList}
        edit={IngredientEdit}
        create={IngredientCreate}
        recordRepresentation="name"
      />
      <Resource
        name="ingredient-categories"
        list={CategoryList}
        edit={CategoryEdit}
        create={CategoryCreate}
        recordRepresentation="name"
        options={{ label: 'Ingredient categories' }}
      />
      <Resource
        name="meal-types"
        list={MealTypeList}
        edit={MealTypeEdit}
        create={MealTypeCreate}
        recordRepresentation="name"
        options={{ label: 'Meal types' }}
      />
      <Resource
        name="diet-preferences"
        list={SimpleNameList}
        edit={SimpleNameEdit}
        create={SimpleNameCreate}
        recordRepresentation="name"
        options={{ label: 'Diet preferences' }}
      />
      <Resource
        name="cooking-styles"
        list={SimpleNameList}
        edit={SimpleNameEdit}
        create={SimpleNameCreate}
        recordRepresentation="name"
        options={{ label: 'Cooking styles' }}
      />
      <Resource
        name="post-tags"
        list={SimpleNameList}
        edit={SimpleNameEdit}
        create={SimpleNameCreate}
        recordRepresentation="name"
        options={{ label: 'Post tags' }}
      />

      <Resource
        name="articles"
        list={ArticleList}
        edit={ArticleEdit}
        create={ArticleCreate}
        recordRepresentation="title"
        options={{ label: 'Learn articles' }}
      />

      <Resource
        name="settings"
        list={SettingList}
        edit={SettingEdit}
        create={SettingCreate}
        recordRepresentation="key"
      />
      <Resource name="support" list={SupportList} show={SupportShow} options={{ label: 'Support' }} />

      {/* Both queues are legal/marketplace obligations, not conveniences:
          reports is Apple's UGC moderation requirement, delete-requests is GDPR. */}
      <Resource name="reports" list={ReportList} options={{ label: 'Reported posts' }} />
      <Resource
        name="delete-requests"
        list={DeleteRequestList}
        options={{ label: 'Deletion requests' }}
      />
    </Admin>
  );
}
