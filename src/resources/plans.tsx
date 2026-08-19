import {
  Create,
  Datagrid,
  Edit,
  List,
  NumberField,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from 'react-admin';

export const PlanList = () => (
  <List exporter={false} sort={{ field: 'price', order: 'ASC' }}>
    <Datagrid bulkActionButtons={false} rowClick="edit">
      <TextField source="name" />
      <NumberField source="price" />
      <TextField source="currency" />
      <TextField source="billingCycle" label="Cycle" />
      <NumberField source="validityDays" label="Days" />
      <TextField source="appleProductId" label="Apple product" />
      <TextField source="status" />
    </Datagrid>
  </List>
);

const PlanForm = () => (
  <SimpleForm>
    <TextInput source="name" validate={required()} fullWidth />
    <TextInput source="description" fullWidth multiline />

    <ReferenceInput source="programId" reference="programs">
      <SelectInput optionText="name" validate={required()} label="Programme" />
    </ReferenceInput>

    <NumberInput source="price" validate={required()} min={0} />
    <SelectInput
      source="currency"
      choices={[
        { id: 'GBP', name: 'GBP' },
        { id: 'USD', name: 'USD' },
        { id: 'EUR', name: 'EUR' },
      ]}
      defaultValue="GBP"
    />
    <SelectInput
      source="billingCycle"
      choices={[
        { id: 'MONTHLY', name: 'Monthly' },
        { id: 'YEARLY', name: 'Yearly' },
      ]}
      defaultValue="MONTHLY"
    />
    <NumberInput source="validityDays" validate={required()} min={1} max={3650} />

    <TextInput
      source="appleProductId"
      label="Apple product id"
      fullWidth
      helperText="Must match the subscription product in App Store Connect, or in-app purchase cannot map a payment to this plan"
    />
    <TextInput source="googleProductId" label="Google product id" fullWidth />

    <SelectInput
      source="status"
      choices={[
        { id: 'ACTIVE', name: 'Active' },
        { id: 'INACTIVE', name: 'Inactive' },
      ]}
      defaultValue="ACTIVE"
    />
  </SimpleForm>
);

export const PlanEdit = () => (
  <Edit mutationMode="pessimistic">
    <PlanForm />
  </Edit>
);

export const PlanCreate = () => (
  <Create>
    <PlanForm />
  </Create>
);
