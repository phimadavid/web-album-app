type JsonResponseParams = Record<string, any> & {
   status?: number;
};

/**
 * @param {JsonResponseParams} data
 * @returns {Response}
 */

export const jsonResponse = (data: JsonResponseParams) =>
   new Response(JSON.stringify({ ...data }), {
      status: data.status || 200,
   });
