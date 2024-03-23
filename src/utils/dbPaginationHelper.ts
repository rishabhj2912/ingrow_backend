import * as yup from 'yup';
import { connectDb } from './config/db';

export const PER_PAGE_LIMIT = 10;

/* ----------------------------------------------------------*
              Get Skip and Limit
*-----------------------------------------------------------*/
export function getSkipLimit(page: number, limit: number) {
  return [(page - 1) * limit, limit];
}

/* ----------------------------------------------------------*
                  Main Pagination Function
*-----------------------------------------------------------*/
export async function Paginate(
  collection: string,
  query: Array<any>,
  page: number,
  limit: number = PER_PAGE_LIMIT
) {
  const dbClient = await connectDb();
  const [skip, limitPerPage] = getSkipLimit(page, limit);
  const reviewQuery = query[query.length - 1].$facet.docs;
  reviewQuery.push({ $skip: skip });
  reviewQuery.push({ $limit: limitPerPage });
  const data = await dbClient.collection(collection).aggregate(query).toArray();
  const [docs] = data;
  const { meta } = docs;
  if (meta.length === 0) {
    const newMeta = {
      totalDocs: 0,
      docsPerPage: limit,
      currentPage: page,
      totalPages: 0
    };
    docs.meta = newMeta;
    return docs;
  }
  const [metaData] = meta;
  const { totalDocs } = metaData;
  const newMetaData = {
    ...metaData,
    docsPerPage: limit,
    currentPage: page,
    totalPages: Math.ceil(totalDocs / limit)
  };
  docs.meta = newMetaData;
  return docs;
}

/* ----------------------------------------------------------*
             Generate Paginated Query
*-----------------------------------------------------------*/
export function generateQueryForPagination(query: any) {
  return [
    {
      $facet: {
        docs: [...query],
        meta: [
          {
            $count: 'totalDocs'
          }
        ]
      }
    }
  ];
}

/* ----------------------------------------------------------*
              Default pagiantion Object
*-----------------------------------------------------------*/
export function defaultPaginatedResult() {
  return {
    docs: [],
    meta: {
      totalDocs: 0,
      docsPerPage: 10,
      currentPage: 1,
      totalPages: 0
    }
  };
}

export const paginationSchema = yup.object().shape({
  page: yup.number().required()
});

export type byPageResult = {
  docs: Array<unknown>;
  meta: {
    totalDocs: number;
    docsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
};
