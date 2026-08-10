import {
  AutocompleteArrayInput,
  Create,
  Datagrid,
  Edit,
  FunctionField,
  List,
  NumberField,
  NumberInput,
  ReferenceArrayInput,
  SaveButton,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from 'react-admin';
import { ProgramDayMapper } from './programDays';

export const ComboList = () => (
  <List exporter={false}>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <FunctionField
        label="Recipes"
        render={(r: any) =>
          (r.recipes ?? [])
            .map((row: any) => row.recipe?.name)
            .filter(Boolean)
            .join(', ') || '—'
        }
      />
      <TextField source="notes" />
    </Datagrid>
  </List>
);

const ComboForm = () => (
  <SimpleForm>
    <TextInput source="name" validate={required()} fullWidth />
    <TextInput source="notes" fullWidth multiline />
    <ReferenceArrayInput source="recipeIds" reference="recipes">
      <AutocompleteArrayInput
        optionText="name"
        label="Recipes, in the order they are eaten"
        fullWidth
      />
    </ReferenceArrayInput>
  </SimpleForm>
);

export const ComboEdit = () => (
  <Edit mutationMode="pessimistic">
    <ComboForm />
  </Edit>
);

export const ComboCreate = () => (
  <Create>
    <ComboForm />
  </Create>
);

export const ProgramList = () => (
  <List exporter={false}>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <NumberField source="totalDays" label="Days" />
      <FunctionField
        label="Mapped"
        render={(r: any) => {
          const mapped = (r.programComboDays ?? r.days ?? []).length;
          const total = r.totalDays ?? 0;
          return mapped >= total && total > 0 ? `${mapped}/${total}` : `${mapped}/${total} incomplete`;
        }}
      />
      <TextField source="status" />
    </Datagrid>
  </List>
);

const ProgramForm = () => (
  <SimpleForm>
    <TextInput source="name" validate={required()} fullWidth />
    <TextInput source="description" fullWidth multiline />
    <NumberInput
      source="totalDays"
      validate={required()}
      min={1}
      max={365}
      helperText="Every day from 1 to this number must be mapped to a combo before the plan can be sold"
    />
  </SimpleForm>
);

export const ProgramEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={false}>
      <TextInput source="name" validate={required()} fullWidth />
      <TextInput source="description" fullWidth multiline />
      <NumberInput
        source="totalDays"
        validate={required()}
        min={1}
        max={365}
        helperText="Every day from 1 to this number must be mapped to a combo before the plan can be sold"
      />
      <SaveButton />
      <ProgramDayMapper />
    </SimpleForm>
  </Edit>
);

export const ProgramCreate = () => (
  <Create>
    <ProgramForm />
  </Create>
);
