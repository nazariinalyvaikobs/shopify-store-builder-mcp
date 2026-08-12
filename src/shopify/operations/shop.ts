import type { ShopifyClient } from "../client.js";
import { ShopifyUserError, type UserError } from "../errors.js";

function unwrapMutation<T>(operation: string, payload: T | null | undefined, userErrors: UserError[]): T {
  if (userErrors.length > 0) throw new ShopifyUserError(operation, userErrors);
  if (payload == null) throw new Error(`${operation} returned no data and no errors`);
  return payload;
}

export interface Shop {
  name: string;
  myshopifyDomain: string;
  currencyCode: string;
  primaryDomain: { url: string };
  plan: { displayName: string };
}

const SHOP_INFO_QUERY = `
  query ShopInfo {
    shop {
      name
      myshopifyDomain
      currencyCode
      primaryDomain { url }
      plan { displayName }
    }
  }`;

export async function fetchShopInfo(client: ShopifyClient): Promise<Shop> {
  const data = await client.query<{ shop: Shop }>(SHOP_INFO_QUERY);
  return data.shop;
}

interface Theme {
  id: string;
  name: string;
  role: "MAIN" | "UNPUBLISHED" | "DEVELOPMENT" | "DEMO";
}

const LIST_THEMES_QUERY = `
  query ListThemes {
    themes(first: 10) {
      nodes { id name role }
    }
  }`;

export async function listThemes(client: ShopifyClient): Promise<Theme[]> {
  const data = await client.query<{ themes: { nodes: Theme[] } }>(LIST_THEMES_QUERY);
  return data.themes.nodes;
}

interface UpdateThemeFileInput {
  themeId: string;
  filePath: string;
  fileContent: string;
}

const UPDATE_THEME_FILE_MUTATION = `
  mutation UpdateThemeFile($themeId: ID!, $filePath: String!, $fileContent: String!) {
    themeFilesUpsert(
      themeId: $themeId
      files: [{ filename: $filePath, body: { type: TEXT, value: $fileContent } }]
    ) {
      upsertedThemeFiles { filename }
      job { id }
      userErrors { field message }
    }
  }`;

interface ThemeFilesUpsertPayload {
  upsertedThemeFiles: { filename: string }[] | null;
  job: { id: string } | null;
  userErrors: UserError[];
}

export async function updateThemeFile(
  client: ShopifyClient,
  input: UpdateThemeFileInput,
): Promise<{ filename: string; jobId: string | null }> {
  const data = await client.query<{ themeFilesUpsert: ThemeFilesUpsertPayload }>(
    UPDATE_THEME_FILE_MUTATION,
    { ...input },
  );
  const { upsertedThemeFiles, job, userErrors } = data.themeFilesUpsert;
  if (userErrors.length > 0) throw new ShopifyUserError("themeFilesUpsert", userErrors);
  return {
    filename: upsertedThemeFiles?.[0]?.filename ?? input.filePath,
    jobId: job?.id ?? null,
  };
}

const READ_THEME_FILE_QUERY = `
  query ReadThemeFile($themeId: ID!, $filePath: String!) {
    theme(id: $themeId) {
      files(filenames: [$filePath], first: 1) {
        nodes {
          filename
          body {
            ... on OnlineStoreThemeFileBodyText {
              content
            }
          }
        }
      }
    }
  }`;

interface ReadThemeFileResponse {
  theme: {
    files: {
      nodes: { filename: string; body: { content: string | null } | null }[];
    };
  } | null;
}

export async function readThemeFile(
  client: ShopifyClient,
  themeId: string,
  filePath: string,
): Promise<string> {
  const data = await client.query<ReadThemeFileResponse>(READ_THEME_FILE_QUERY, { themeId, filePath });

  if (!data.theme) throw new Error(`Theme with ID ${themeId} not found`);

  const file = data.theme.files.nodes[0];
  if (!file) throw new Error(`File ${filePath} not found in theme ${themeId}`);

  const content = file.body?.content;
  if (content == null) throw new Error(`File ${filePath} in theme ${themeId} has no content`);

  return content;
}

interface Page {
  id: string;
  title: string;
  handle: string;
  isPublished: boolean;
}

export interface PageCreateInput {
  title: string;
  handle?: string;
  body?: string;
  isPublished?: boolean;
}

export type PageUpdateInput = Partial<PageCreateInput>;

interface PageMutationPayload {
  page: Page | null;
  userErrors: UserError[];
}

const CREATE_PAGE_MUTATION = `
  mutation CreatePage($page: PageCreateInput!) {
    pageCreate(page: $page) {
      page { id title handle isPublished }
      userErrors { field message }
    }
  }`;

export async function createPage(client: ShopifyClient, input: PageCreateInput): Promise<Page> {
  const data = await client.query<{ pageCreate: PageMutationPayload }>(CREATE_PAGE_MUTATION, {
    page: input,
  });
  return unwrapMutation("pageCreate", data.pageCreate.page, data.pageCreate.userErrors);
}

const UPDATE_PAGE_MUTATION = `
  mutation UpdatePage($id: ID!, $page: PageUpdateInput!) {
    pageUpdate(id: $id, page: $page) {
      page { id title handle isPublished }
      userErrors { field message }
    }
  }`;

export async function updatePage(
  client: ShopifyClient,
  id: string,
  input: PageUpdateInput,
): Promise<Page> {
  const data = await client.query<{ pageUpdate: PageMutationPayload }>(UPDATE_PAGE_MUTATION, {
    id,
    page: input,
  });
  return unwrapMutation("pageUpdate", data.pageUpdate.page, data.pageUpdate.userErrors);
}

const LIST_PAGES_QUERY = `
  query ListPages {
    pages(first: 20) {
      nodes { id title handle isPublished }
    }
  }`;

export async function listPages(client: ShopifyClient): Promise<Page[]> {
  const data = await client.query<{ pages: { nodes: Page[] } }>(LIST_PAGES_QUERY);
  return data.pages.nodes;
}

interface MenuItem {
  id: string;
  title: string;
  type: string;
  url: string | null;
  items?: MenuItem[];
}

interface Menu {
  id: string;
  handle: string;
  title: string;
  items: MenuItem[];
}

export interface MenuItemInput {
  id?: string;
  title: string;
  type: string;
  url?: string;
  resourceId?: string;
  items?: MenuItemInput[];
}

const LIST_MENUS_QUERY = `
  query ListMenus {
    menus(first: 10) {
      nodes {
        id
        handle
        title
        items {
          id
          title
          type
          url
          items { id title type url }
        }
      }
    }
  }`;

export async function listMenus(client: ShopifyClient): Promise<Menu[]> {
  const data = await client.query<{ menus: { nodes: Menu[] } }>(LIST_MENUS_QUERY);
  return data.menus.nodes;
}

const UPDATE_MENU_MUTATION = `
  mutation UpdateMenu($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]!) {
    menuUpdate(id: $id, title: $title, items: $items) {
      menu { id handle title items { id title type url } }
      userErrors { field message }
    }
  }`;

interface MenuMutationPayload {
  menu: Menu | null;
  userErrors: UserError[];
}

export async function updateMenu(
  client: ShopifyClient,
  id: string,
  title: string,
  items: MenuItemInput[],
): Promise<Menu> {
  const data = await client.query<{ menuUpdate: MenuMutationPayload }>(UPDATE_MENU_MUTATION, {
    id,
    title,
    items,
  });
  return unwrapMutation("menuUpdate", data.menuUpdate.menu, data.menuUpdate.userErrors);
}
