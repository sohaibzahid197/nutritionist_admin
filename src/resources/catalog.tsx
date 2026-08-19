import {
  Create,
  Datagrid,
  Edit,
  List,
  NumberInput,
  SearchInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from 'react-admin';

const STATUS = [
  { id: 'ACTIVE', name: 'Active' },
  { id: 'INACTIVE', name: 'Inactive' },
];

const filters = [<SearchInput source="search" alwaysOn key="search" />];

const NameList = ({ extra }: { extra?: string[] }) => (
  <List filters={filters} filter={{ includeInactive: true }} exporter={false}>
    <Datagrid bulkActionButtons={false} rowClick="edit">
      <TextField source="name" />
      {(extra ?? []).map((field) => (
        <TextField key={field} source={field} />
      ))}
      <TextField source="status" />
    </Datagrid>
  </List>
);

const NameForm = ({ children }: { children?: React.ReactNode }) => (
  <SimpleForm>
    <TextInput source="name" validate={required()} fullWidth />
    {children}
    <SelectInput source="status" choices={STATUS} defaultValue="ACTIVE" />
  </SimpleForm>
);

export const MealTypeList = () => <NameList extra={['orderIndex']} />;
export const MealTypeEdit = () => (
  <Edit mutationMode="pessimistic">
    <NameForm>
      <NumberInput source="orderIndex" min={0} />
    </NameForm>
  </Edit>
);
export const MealTypeCreate = () => (
  <Create>
    <NameForm>
      <NumberInput source="orderIndex" min={0} defaultValue={0} />
    </NameForm>
  </Create>
);

export const SimpleNameList = () => <NameList />;
export const SimpleNameEdit = () => (
  <Edit mutationMode="pessimistic">
    <NameForm />
  </Edit>
);
export const SimpleNameCreate = () => (
  <Create>
    <NameForm />
  </Create>
);

export const CategoryList = () => <NameList extra={['orderIndex']} />;
export const CategoryEdit = MealTypeEdit;
export const CategoryCreate = MealTypeCreate;

export const IngredientList = () => (
  <List filters={filters} filter={{ includeInactive: true }} exporter={false}>
    <Datagrid bulkActionButtons={false} rowClick="edit">
      <TextField source="name" />
      <TextField source="baseUnit" label="Unit" />
      <TextField source="densityGPerMl" label="g/ml" />
      <TextField source="gramsPerPiece" label="g/piece" />
      <TextField source="status" />
    </Datagrid>
  </List>
);

const IngredientForm = () => (
  <SimpleForm>
    <TextInput source="name" validate={required()} fullWidth />
    <SelectInput
      source="baseUnit"
      choices={[
        { id: 'g', name: 'g' },
        { id: 'ml', name: 'ml' },
        { id: 'piece', name: 'piece' },
      ]}
    />
    <NumberInput source="densityGPerMl" label="Grams per ml" helperText="Liquids measured by volume" />
    <NumberInput source="gramsPerPiece" label="Grams per piece" helperText="Things counted, like an egg" />
    <SelectInput source="status" choices={STATUS} defaultValue="ACTIVE" />
  </SimpleForm>
);

export const IngredientEdit = () => (
  <Edit mutationMode="pessimistic">
    <IngredientForm />
  </Edit>
);
export const IngredientCreate = () => (
  <Create>
    <IngredientForm />
  </Create>
);
