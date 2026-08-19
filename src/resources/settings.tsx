import {
  BooleanField,
  BooleanInput,
  Create,
  Datagrid,
  Edit,
  List,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from 'react-admin';

/**
 * Key/value settings. Several are load-bearing:
 *   blog_link            the URL the app's Learn tab opens
 *   about_us             \
 *   terms_and_condition   } read by the app's Document screens; Apple requires the last
 *   privacy_policy       /  two to be reachable in-app before review
 *
 * Only settings marked public are readable without a token, which is how the app fetches
 * the legal documents before sign-in.
 */
const KNOWN_KEYS = [
  { id: 'blog_link', name: 'blog_link — Learn tab destination' },
  { id: 'about_us', name: 'about_us' },
  { id: 'terms_and_condition', name: 'terms_and_condition' },
  { id: 'privacy_policy', name: 'privacy_policy' },
];

export const SettingList = () => (
  <List perPage={100} pagination={false} exporter={false}>
    <Datagrid bulkActionButtons={false} rowClick="edit">
      <TextField source="key" />
      <TextField source="value" />
      <BooleanField source="isPublic" label="Public" />
    </Datagrid>
  </List>
);

export const SettingEdit = () => (
  <Edit mutationMode="pessimistic" redirect="list">
    <SimpleForm>
      <TextField source="key" />
      <TextInput source="value" multiline fullWidth rows={6} validate={required()} />
      <BooleanInput
        source="isPublic"
        label="Readable without signing in"
        helperText="The legal documents must be public; blog_link does not need to be."
      />
    </SimpleForm>
  </Edit>
);

export const SettingCreate = () => (
  <Create mutationMode="pessimistic" redirect="list">
    <SimpleForm>
      <TextInput
        source="key"
        validate={required()}
        fullWidth
        helperText={`Known keys: ${KNOWN_KEYS.map((k) => k.id).join(', ')}`}
      />
      <TextInput source="value" multiline fullWidth rows={6} validate={required()} />
      <BooleanInput source="isPublic" label="Readable without signing in" />
    </SimpleForm>
  </Create>
);
