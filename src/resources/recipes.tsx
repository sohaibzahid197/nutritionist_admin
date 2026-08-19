import {
  ArrayInput,
  AutocompleteArrayInput,
  AutocompleteInput,
  Create,
  Datagrid,
  Edit,
  List,
  NumberField,
  NumberInput,
  ReferenceArrayInput,
  ReferenceField,
  ReferenceInput,
  SearchInput,
  SelectInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  required,
  useRecordContext,
} from 'react-admin';
import { Typography } from '@mui/material';

const STATUS = [
  { id: 'ACTIVE', name: 'Active' },
  { id: 'INACTIVE', name: 'Inactive' },
];

const filters = [
  <SearchInput source="search" alwaysOn key="search" />,
  <ReferenceInput source="mealTypeId" reference="meal-types" key="mealType">
    <SelectInput optionText="name" label="Meal type" />
  </ReferenceInput>,
];

/**
 * The API accepts a recipe with an empty ingredient list, and the app then
 * renders a dish nobody can shop for or cook. Cheaper to refuse here, where the
 * author can still see what they missed.
 */
const atLeastOne = (noun: string) => (value: unknown) =>
  Array.isArray(value) && value.length > 0 ? undefined : `Add at least one ${noun}`;

export const RecipeList = () => (
  <List
    filters={filters}
    filter={{ includeInactive: true }}
    exporter={false}
    sort={{ field: 'name', order: 'ASC' }}
  >
    <Datagrid bulkActionButtons={false} rowClick="edit">
      <TextField source="name" />
      <ReferenceField source="mealTypeId" reference="meal-types" link={false} label="Meal type">
        <TextField source="name" />
      </ReferenceField>
      <NumberField source="kcal" />
      <NumberField source="protein" label="P" />
      <NumberField source="carb" label="C" />
      <NumberField source="fat" label="F" />
      <NumberField source="servings" />
      <TextField source="status" />
    </Datagrid>
  </List>
);

const MacroCheck = () => {
  const record = useRecordContext();
  if (!record) return null;

  const derived = (record.protein ?? 0) * 4 + (record.carb ?? 0) * 4 + (record.fat ?? 0) * 9;
  if (!record.kcal || !derived) return null;

  const drift = Math.abs(derived - record.kcal) / record.kcal;
  if (drift <= 0.25) return null;

  return (
    <Typography variant="body2" color="error" sx={{ mb: 2 }}>
      Macros imply about {Math.round(derived)} kcal but this recipe says {record.kcal}. One of them
      is probably mistyped.
    </Typography>
  );
};

const RecipeForm = () => (
  <SimpleForm>
    <TextInput source="name" validate={required()} fullWidth />

    <MacroCheck />

    <ReferenceInput source="mealTypeId" reference="meal-types">
      <SelectInput optionText="name" label="Meal type" />
    </ReferenceInput>

    <NumberInput source="kcal" validate={required()} min={0} />
    <NumberInput source="protein" validate={required()} min={0} />
    <NumberInput source="carb" validate={required()} min={0} />
    <NumberInput source="fat" validate={required()} min={0} />
    <NumberInput source="fibre" validate={required()} min={0} />
    <NumberInput source="servings" min={1} max={12} defaultValue={2} />
    <NumberInput source="prepMinutes" min={0} />
    <TextInput source="image" fullWidth />

    <ReferenceArrayInput source="dietPreferenceIds" reference="diet-preferences">
      <AutocompleteArrayInput optionText="name" label="Diet preferences" fullWidth />
    </ReferenceArrayInput>

    <ReferenceArrayInput source="cookingStyleIds" reference="cooking-styles">
      <AutocompleteArrayInput optionText="name" label="Cooking styles" fullWidth />
    </ReferenceArrayInput>

    <ArrayInput source="ingredients" validate={atLeastOne('ingredient')}>
      <SimpleFormIterator inline>
        <ReferenceInput source="ingredientId" reference="ingredients">
          <AutocompleteInput optionText="name" label="Ingredient" />
        </ReferenceInput>
        <NumberInput source="qty" min={0} />
        <TextInput source="unit" />
        <SelectInput
          source="displayFormat"
          choices={[
            { id: 'FRACTION', name: 'Fraction' },
            { id: 'DECIMAL', name: 'Decimal' },
          ]}
          defaultValue="FRACTION"
        />
      </SimpleFormIterator>
    </ArrayInput>

    <ArrayInput source="methods" label="Method steps" validate={atLeastOne('method step')}>
      <SimpleFormIterator>
        <TextInput source="" label="Step" multiline fullWidth />
      </SimpleFormIterator>
    </ArrayInput>

    <ArrayInput source="flavourBoosters" label="Flavour boosters">
      <SimpleFormIterator inline>
        <TextInput source="" label="Booster" />
      </SimpleFormIterator>
    </ArrayInput>

    <SelectInput source="status" choices={STATUS} defaultValue="ACTIVE" />
  </SimpleForm>
);

export const RecipeEdit = () => (
  <Edit mutationMode="pessimistic">
    <RecipeForm />
  </Edit>
);

export const RecipeCreate = () => (
  <Create>
    <RecipeForm />
  </Create>
);
