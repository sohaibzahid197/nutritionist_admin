import {
  Datagrid,
  DateField,
  FunctionField,
  List,
  NumberField,
  SearchInput,
  SelectInput,
  TextField,
} from 'react-admin';

const filters = [
  <SearchInput source="search" alwaysOn key="search" />,
  <SelectInput
    source="status"
    key="status"
    choices={[
      { id: 'LIVE', name: 'Live (active and unexpired)' },
      { id: 'LAPSED', name: 'Lapsed' },
      { id: 'ACTIVE', name: 'ACTIVE' },
      { id: 'EXPIRED', name: 'EXPIRED' },
      { id: 'CANCELLED', name: 'CANCELLED' },
      { id: 'SUSPENDED', name: 'SUSPENDED' },
    ]}
  />,
  <SelectInput
    source="source"
    key="source"
    choices={[
      { id: 'ADMIN_GRANT', name: 'Admin grant' },
      { id: 'PURCHASE', name: 'Purchase' },
      { id: 'COMP', name: 'Comp' },
      { id: 'DEMO', name: 'Demo' },
      { id: 'MIGRATED', name: 'Migrated' },
    ]}
  />,
];

export const SubscriptionList = () => (
  <List filters={filters} sort={{ field: 'expiresOn', order: 'ASC' }} exporter={false}>
    <Datagrid bulkActionButtons={false} rowClick={false}>
      <FunctionField label="User" render={(r: any) => r.user?.email ?? r.userId} />
      <FunctionField label="Plan" render={(r: any) => r.plan?.name ?? '—'} />
      <TextField source="status" />
      <TextField source="source" />
      <DateField source="programStartsOn" label="Starts" />
      <DateField source="expiresOn" label="Expires" />
      <NumberField source="amountPaid" label="Paid" />
    </Datagrid>
  </List>
);
