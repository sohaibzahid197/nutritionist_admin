import {
  BooleanInput,
  Button,
  Datagrid,
  DateField,
  EmailField,
  FunctionField,
  List,
  Show,
  SimpleShowLayout,
  TextField,
  TopToolbar,
  useNotify,
  useRecordContext,
  useRefresh,
} from 'react-admin';
import { request } from '../api';

const filters = [<BooleanInput source="unresolvedOnly" label="Unresolved only" alwaysOn key="u" />];

export const SupportList = () => (
  <List filters={filters} filterDefaultValues={{ unresolvedOnly: true }} exporter={false}>
    <Datagrid bulkActionButtons={false} rowClick="show">
      <TextField source="subject" />
      <TextField source="name" />
      <EmailField source="email" />
      <FunctionField label="Resolved" render={(r: any) => (r.resolvedAt ? 'Yes' : 'No')} />
      <DateField source="createdAt" label="Received" showTime />
    </Datagrid>
  </List>
);

const ResolveButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  if (!record || record.resolvedAt) return null;

  const resolve = async () => {
    try {
      await request(`/admin/support/${record.id}/resolve`, { method: 'POST' });
      notify('Marked resolved', { type: 'success' });
      refresh();
    } catch (err) {
      notify((err as Error).message, { type: 'error' });
    }
  };

  return <Button label="Mark resolved" onClick={resolve} />;
};

export const SupportShow = () => (
  <Show
    actions={
      <TopToolbar>
        <ResolveButton />
      </TopToolbar>
    }
  >
    <SimpleShowLayout>
      <TextField source="subject" />
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="message" />
      <DateField source="createdAt" label="Received" showTime />
      <FunctionField
        label="Resolved"
        render={(r: any) => (r.resolvedAt ? new Date(r.resolvedAt).toLocaleString() : 'No')}
      />
    </SimpleShowLayout>
  </Show>
);
