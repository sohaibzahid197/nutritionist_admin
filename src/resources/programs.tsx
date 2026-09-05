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
  useRecordContext,
} from 'react-admin';
import { Box, Chip, Typography } from '@mui/material';
import { ProgramDayMapper } from './programDays';

/** An empty combo silently yields a day with no meals for everyone mapped to it. */
const comboNeedsRecipes = (value: unknown) =>
  Array.isArray(value) && value.length > 0 ? undefined : 'Add at least one recipe';

/**
 * Where a combo sits, taken from its first programme placement.
 *
 * A combo on its own is four anonymous dishes. Editing one without knowing it
 * is Tuesday of the live programme is how somebody changes what a subscriber
 * eats tomorrow by accident.
 */
const Placement = () => {
  const record = useRecordContext();
  const placement = (record as any)?.programComboDays?.[0];
  if (!placement) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
        Not in a programme
      </Typography>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
      <Chip label={placement.program.name} size="small" />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        day {placement.day}
      </Typography>
    </Box>
  );
};

export const ComboList = () => (
  <List exporter={false} sort={{ field: 'name', order: 'ASC' }}>
    <Datagrid bulkActionButtons={false} rowClick="edit">
      <TextField source="name" />
      <FunctionField label="Programme" render={() => <Placement />} />
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
    <ReferenceArrayInput source="recipeIds" reference="recipes" validate={comboNeedsRecipes}>
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
    <Datagrid bulkActionButtons={false} rowClick="edit">
      <TextField source="name" />
      <NumberField source="totalDays" label="Days" />
      <FunctionField
        label="Mapped"
        render={(r: any) => {
          // The list endpoint returns mappedDays/isComplete; the day rows
          // themselves only come back from getProgram. Reading the relation
          // here always found nothing, so finished programmes were reported
          // to the nutritionist as incomplete.
          const mapped = r.mappedDays ?? 0;
          const total = r.totalDays ?? 0;
          return r.isComplete ? `${mapped}/${total}` : `${mapped}/${total} incomplete`;
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
