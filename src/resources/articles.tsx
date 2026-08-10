import {
  Create,
  Datagrid,
  DateField,
  Edit,
  FunctionField,
  List,
  NumberInput,
  SearchInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from 'react-admin';
import { Alert, Typography } from '@mui/material';

const articleFilters = [
  <SearchInput source="search" alwaysOn key="search" />,
  <SelectInput
    source="status"
    key="status"
    choices={[
      { id: 'ACTIVE', name: 'Published' },
      { id: 'INACTIVE', name: 'Draft' },
    ]}
  />,
];

export const ArticleList = () => (
  <List filters={articleFilters} exporter={false} sort={{ field: 'position', order: 'ASC' }}>
    <Datagrid rowClick="edit">
      <TextField source="title" />
      <FunctionField
        label="Status"
        render={(r: any) => (r.status === 'ACTIVE' ? 'Published' : 'Draft')}
      />
      <FunctionField label="Read" render={(r: any) => `${r.readMinutes ?? 1} min`} />
      <DateField source="publishedAt" label="Published" />
      <TextField source="position" label="Order" />
    </Datagrid>
  </List>
);

const ArticleForm = ({ creating = false }: { creating?: boolean }) => (
  <SimpleForm>
    <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
      Readers see published articles inside the app, not a web page. Write in plain
      paragraphs; <strong>##</strong> starts a heading, <strong>-</strong> a bullet,
      <strong> &gt;</strong> a pull quote. Leave a blank line between blocks.
    </Alert>

    <TextInput source="title" validate={required()} fullWidth />

    <TextInput
      source="body"
      validate={required()}
      fullWidth
      multiline
      minRows={16}
      helperText="Reading time and the list excerpt are worked out from this automatically."
    />

    <TextInput
      source="excerpt"
      fullWidth
      multiline
      helperText="Optional. Leave empty to use the opening paragraph."
    />

    <TextInput
      source="image"
      fullWidth
      helperText="Optional cover image URL. Upload it first, then paste the address here."
    />

    <SelectInput
      source="status"
      defaultValue="INACTIVE"
      choices={[
        { id: 'INACTIVE', name: 'Draft — nobody can see it' },
        { id: 'ACTIVE', name: 'Published — visible to subscribers' },
      ]}
      helperText="Publishing sets the date automatically if it has none."
    />

    <NumberInput
      source="position"
      defaultValue={0}
      min={0}
      helperText="Lower numbers appear first. Ties fall back to newest published."
    />

    {creating ? null : (
      <Typography variant="body2" color="text.secondary">
        Renaming an article changes its address. Anyone who saved it offline keeps
        their copy until they open it again.
      </Typography>
    )}
  </SimpleForm>
);

export const ArticleEdit = () => (
  <Edit mutationMode="pessimistic">
    <ArticleForm />
  </Edit>
);

export const ArticleCreate = () => (
  <Create>
    <ArticleForm creating />
  </Create>
);
