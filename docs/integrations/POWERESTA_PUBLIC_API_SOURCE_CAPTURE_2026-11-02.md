

svg

# PoweResta public API

```
 1.0.0 
```

```
OAS 3.0
```

Descriptions for PoweResta public API endpoints.

**Servers**

**https\://publicapi.fi.poweresta.com/public/ - The public API server address.https\://publicapi.fi.poweresta.com/ - The public API server address for login endpoint.**

### Login, version 1 (default)

**POST**

**/login/**

Log in to the public menu of PoweResta. Unlike other endpoints the login endpoint is not under "public" segment. In the login request, the tenant name, the public API username, and the password are provided. A JWT access token is returned if the login is successful. This token is included in the header when making other requests to PoweResta. The "Bearer" prefix should not be included in the header in front of the JWT token. Note that the cookie returned upon a successful login should not be used when making other requests. If both the header and the cookie are sent with a request, the request will fail.

#### Parameters

No parameters

#### Request body

**application/json**

- **Example Value**
- Schema

```json
{
  "tenant": "string",
  "publicApiUserName": "string",
  "password": "string"
}
```

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "token": "string"
}
```

| *No links* |            |                      |
| ---------- | ---------- | -------------------- |
| 401        | Media type | **application/json** |

- **Example Value**
- Schema

```json
{}
```

| *No links* |
| ---------- |

### Site properties by public url, version 1 (default)

**GET**

**/site/propertybypublicurl/{PUBLIC_URL}/**

Returns all entities.

#### Parameters

| **Name**          | **Description**     |               |   |
| :---------------- | :------------------ | ------------- | - |
| **PUBLIC_URL \*** | **string($string)** | ***(query)*** |   |

The public URL of the site for which property values are to be returned.

| **authorization \*** | **string($string)** | ***(header)*** |   |
| -------------------- | ------------------- | -------------- | - |

The JWT access token.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "value": "string",
  "propertyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "propertyCode": "string"
}
```

| *No links* |
| ---------- |

### Site, version 1 (default)

**GET**

**/site/{id}**

Returns an entity by id.

#### Parameters

| **Name**  | **Description**   |              |   |
| :-------- | :---------------- | ------------ | - |
| **id \*** | **string($uuid)** | ***(path)*** |   |

The site id.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "string",
  "shortName": "string",
  "publicUrl": "string"
}
```

| *No links* |
| ---------- |

### Allergen, version 1 (default)

**GET**

**/allergen/{id}**

Returns an entity by id.

#### Parameters

| **Name**  | **Description**   |              |   |
| :-------- | :---------------- | ------------ | - |
| **id \*** | **string($uuid)** | ***(path)*** |   |

The allergen id.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "description": "string",
  "code": "string",
  "containmentCode": "string",
  "names": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string"
    }
  ]
}
```

| *No links* |
| ---------- |

### Supported languages, version 1 (default)

**GET**

**/language/**

Get languages supported by the system.

#### Parameters

No parameters

#### Responses

| **Code** | **Description** | **Links** |
| :------- | :-------------- | :-------- |
| 200      |                 |           |

Languages that are supported by the system.

Media type

**application/json**

Controls `Accept` header.

- **Example Value**
- Schema

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "code": "string",
  "name": "string"
}
```

| *No links* |
| ---------- |

### Country, version 1 (default)

**GET**

**/country/{id}**

### Origin, version 1 (default)

**GET**

**/origin/{id}**

Returns an entity by id.

#### Parameters

| **Name**  | **Description**   |              |   |
| :-------- | :---------------- | ------------ | - |
| **id \*** | **string($uuid)** | ***(path)*** |   |

The origin id.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "description": "string",
  "code": "string",
  "names": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string"
    }
  ]
}
```

| *No links* |
| ---------- |

### Nutritive claim, version 1 (default)

**GET**

**/nutritiveclaim/{id}**

Returns an entity by id.

#### Parameters

| **Name**  | **Description**   |              |   |
| :-------- | :---------------- | ------------ | - |
| **id \*** | **string($uuid)** | ***(path)*** |   |

The nutritive claim id.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "description": "string",
  "code": "string",
  "claimCode": "string",
  "names": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string"
    }
  ]
}
```

| *No links* |
| ---------- |

### Additive, version 1 (default)

**GET**

**/additive/{id}**

Returns an entity by id.

#### Parameters

| **Name**  | **Description**   |              |   |
| :-------- | :---------------- | ------------ | - |
| **id \*** | **string($uuid)** | ***(path)*** |   |

The additive id.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "description": "string",
  "code": "string",
  "names": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string"
    }
  ]
}
```

| *No links* |
| ---------- |

### Diet, version 1 (default)

**GET**

**/diet/{id}**

Returns an entity by id.

#### Parameters

| **Name**  | **Description**   |              |   |
| :-------- | :---------------- | ------------ | - |
| **id \*** | **string($uuid)** | ***(path)*** |   |

The diet id.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "description": "string",
  "code": "string",
  "names": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string"
    }
  ]
}
```

| *No links* |
| ---------- |

### Unit of measurement, version 1 (default)

**GET**

**/unitofmeasurement/{id}**

Returns an entity by id.

#### Parameters

| **Name**  | **Description**   |              |   |
| :-------- | :---------------- | ------------ | - |
| **id \*** | **string($uuid)** | ***(path)*** |   |

The unit of measurement id.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "code": "string",
  "type": 0,
  "ratio": 0,
  "quantityType": 0,
  "names": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string"
    }
  ]
}
```

| *No links* |
| ---------- |

### Recipes, version 1 (default)

**GET**

**/recipe/{id}/?\_languageId={LANGUAGE_id}**

Returns an entity by id.

#### Parameters

| **Name**  | **Description**   |              |   |
| :-------- | :---------------- | ------------ | - |
| **id \*** | **string($uuid)** | ***(path)*** |   |

The recipe id.

| **\_languageId \*** | **string($uuid)** | ***(query)*** |   |
| ------------------- | ----------------- | ------------- | - |

The language of the recipe.

#### Responses

| **Code** | **Description** | **Links** |
| :------- | :-------------- | :-------- |
| 200      |                 |           |

The recipe

Media type

**application/json**

Controls `Accept` header.

- **Example Value**
- Schema

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "siteId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "code": "string",
  "sizeBatch": 0,
  "numberBatch": 0,
  "sizePortion": 0,
  "numberPortion": 0,
  "lossServing": 0,
  "lossCooking": 0,
  "createdAt": "string",
  "updatedAt": "string",
  "names": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string",
      "type": 0
    }
  ],
  "rows": [
    {
      "id": "string",
      "itemId": "string",
      "tradeItemId": "string",
      "subRecipeId": "string",
      "order": 0,
      "type": 0,
      "quantity": "string",
      "quantityUnitOfMeasurementId": "string",
      "lossPreparation": "string",
      "imageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "imageType": 0,
      "imageIdFullUrl": "string",
      "imageIdUrl": "string",
      "translated": [
        {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "info": "string",
          "header": "string",
          "method": "string"
        }
      ],
      "tradeItemNames": [
        {
          "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "string"
        }
      ],
      "itemNames": [
        {
          "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "string",
          "type": 0
        }
      ],
      "subRecipeNames": [
        {
          "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "string",
          "type": 0
        }
      ],
      "portionPriceExclTax": "string",
      "portionPriceInclTax": "string",
      "comparePriceExclTax": "string",
      "comparePriceInclTax": "string",
      "isFoodstuff": true,
      "ratioText": "string",
      "usedTradeItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "purchaseQuantity": "string",
      "percentage": "string"
    }
  ],
  "salesPrices": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "marginExclTax": 0,
      "marginPercent": 0,
      "targetMarginPercent": 0,
      "siteId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "workspaceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string",
      "portionType": 0,
      "priceExclTax": 0,
      "priceInclTax": 0,
      "priceTaxPercent": 0,
      "compensationExclTax": 0,
      "validityStartDate": "string",
      "validityEndDate": "string"
    }
  ],
  "recipeGroups": [
    {
      "recipeGroupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "diets": [
    {
      "dietId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "deliveries": [
    {
      "quantity": 0,
      "siteNames": [
        {
          "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "string"
        }
      ],
      "targetSiteNames": [
        {
          "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "string"
        }
      ]
    }
  ],
  "labelIngredientLists": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ingredients": "string"
    }
  ],
  "labels": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "originId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "origin2Id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "countryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "country2Id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string",
      "dateUseByType": 0,
      "datePackagingType": 0,
      "shelfLife": 0,
      "gtin": "string",
      "translated": [
        {
          "storageInstructions": "string",
          "usageInstructions": "string",
          "info": "string"
        }
      ]
    }
  ],
  "sizePortionRaw": 0,
  "sizePortionCooked": 0,
  "sizeTotalRaw": 0,
  "sizeTotalCooked": 0,
  "sizeTotal": 0,
  "sizeBatchRaw": 0,
  "sizeBatchCooked": 0,
  "comparePriceExclTax": 0,
  "comparePriceInclTax": 0,
  "batchPriceExclTax": 0,
  "batchPriceInclTax": 0,
  "portionPriceExclTax": 0,
  "portionPriceInclTax": 0,
  "nutritiveItem": {
    "portionSize": 0,
    "portionUnitOfMeasurement": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "code": "string",
      "names": [
        {
          "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "language": "string",
          "name": "string"
        }
      ]
    },
    "preparedState": 0,
    "factors": [
      {
        "nutritiveFactor": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "code": "string",
          "source": {
            "name": "string",
            "code": "string",
            "date": "string"
          },
          "energyContent": "string",
          "calculatePercentage": true,
          "names": [
            {
              "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
              "language": "string",
              "name": "string"
            }
          ]
        },
        "value": "string",
        "valuePer100": "string",
        "percentage": "string",
        "energyContent": "string",
        "calculatePercentage": true,
        "energyProportion": "string",
        "compareProportion": "string",
        "unitOfMeasurement": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "code": "string",
          "names": [
            {
              "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
              "language": "string",
              "name": "string"
            }
          ]
        }
      }
    ]
  },
  "co2Value": {
    "valuePerKg": "string",
    "value": "string",
    "portionSize": "string",
    "portionUnitOfMeasurementId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sources": [
      {
        "source": "string",
        "targetCountry": "string",
        "targetYear": "string"
      }
    ]
  },
  "allergens": [
    "string"
  ],
  "label": [
    {
      "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ingredients": "string"
    }
  ],
  "nutritiveClaims": [
    "string"
  ],
  "originCountries": [
    {
      "originId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "countryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "additives": [
    "string"
  ],
  "workspaceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

| *No links* |
| ---------- |

**GET**

**/recipe/**

Returns all entities.

#### Parameters

| **Name** | **Description**   |               |   |
| :------- | :---------------- | ------------- | - |
| siteId   | **string($uuid)** | ***(query)*** |   |

Filter by site id.

| code | **string($string)** | ***(query)*** |   |
| ---- | ------------------- | ------------- | - |

Filter by recipe code.

| sizeBatch | **number($number)** | ***(query)*** |   |
| --------- | ------------------- | ------------- | - |

Filter by batch size.

| numberBatch | **number($number)** | ***(query)*** |   |
| ----------- | ------------------- | ------------- | - |

Filter by batch number.

| sizePortion | **number($number)** | ***(query)*** |   |
| ----------- | ------------------- | ------------- | - |

Filter by portion size.

| numberPortion | **number($number)** | ***(query)*** |   |
| ------------- | ------------------- | ------------- | - |

Filter by number of portions.

| lossServing | **number($number)** | ***(query)*** |   |
| ----------- | ------------------- | ------------- | - |

Filter by serving loss.

| lossCooking | **number($number)** | ***(query)*** |   |
| ----------- | ------------------- | ------------- | - |

Filter by cooking loss.

| createdAt | **string($string)** | ***(query)*** |   |
| --------- | ------------------- | ------------- | - |

Filter by created at date in ISO 8601 UTC format (YYYY-MM-DDTHH\:MM\:SSZ).

| createdAt_gte | **string($string)** | ***(query)*** |   |
| ------------- | ------------------- | ------------- | - |

Filter by created at date from ISO 8601 UTC format (YYYY-MM-DDTHH\:MM\:SSZ).

| createdAt_lte | **string($string)** | ***(query)*** |   |
| ------------- | ------------------- | ------------- | - |

Filter by created at date to ISO 8601 UTC format (YYYY-MM-DDTHH\:MM\:SSZ).

| updatedAt | **string($string)** | ***(query)*** |   |
| --------- | ------------------- | ------------- | - |

Filter by updated at date in ISO 8601 UTC format (YYYY-MM-DDTHH\:MM\:SSZ).

| updatedAt_gte | **string($string)** | ***(query)*** |   |
| ------------- | ------------------- | ------------- | - |

Filter by updated at date from ISO 8601 UTC format (YYYY-MM-DDTHH\:MM\:SSZ).

| updatedAt_lte | **string($string)** | ***(query)*** |   |
| ------------- | ------------------- | ------------- | - |

Filter by updated at date to ISO 8601 UTC format (YYYY-MM-DDTHH\:MM\:SSZ).

| \_embed | **string($string)** | ***(query)*** |   |
| ------- | ------------------- | ------------- | - |

Optional. "names" is already included by default for recipe list responses.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "siteId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "code": "string",
  "sizeBatch": 0,
  "numberBatch": 0,
  "sizePortion": 0,
  "numberPortion": 0,
  "lossServing": 0,
  "lossCooking": 0,
  "createdAt": "string",
  "updatedAt": "string",
  "names": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string",
      "type": 0
    }
  ]
}
```

| *No links* |            |                      |
| ---------- | ---------- | -------------------- |
| 400        | Media type | **application/json** |

- **Example Value**
- Schema

```json
{
  "message": "string"
}
```

| *No links* |
| ---------- |

### Recipe Group, version 1 (default)

**GET**

**/recipegroup/{id}**

Returns an entity by id.

#### Parameters

| **Name**  | **Description**   |              |   |
| :-------- | :---------------- | ------------ | - |
| **id \*** | **string($uuid)** | ***(path)*** |   |

The recipe group id.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "order": 0,
  "names": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "languageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string"
    }
  ]
}
```

| *No links* |
| ---------- |

### Published menu, version 1 (default)

**GET**

**/publicmenu/menu/{SITE_NAME}/?menu={MENU_NAME}**

Get the basic information of published menu of the site.

#### Parameters

| **Name**         | **Description**     |               |   |
| :--------------- | :------------------ | ------------- | - |
| **SITE_NAME \*** | **string($string)** | ***(query)*** |   |

The publish name of the site whose menu's information is to be returned.

| **MENU_NAME \*** | **string($string)** | ***(query)*** |   |
| ---------------- | ------------------- | ------------- | - |

The publish name of the menu.

| **authorization \*** | **string($string)** | ***(header)*** |   |
| -------------------- | ------------------- | -------------- | - |

The JWT access token.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "menuId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "siteId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "version": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "menuNames": [
    {
      "language": "string",
      "name": "string"
    }
  ],
  "menuInformation": [
    {
      "language": "string",
      "information": "string"
    }
  ]
}
```

| *No links* |
| ---------- |

### Published menus by site, version 1 (default)

**GET**

**/publicmenu/menus/{SITE_NAME}/**

Get name information of all published menus of the site.

#### Parameters

| **Name**         | **Description**     |               |   |
| :--------------- | :------------------ | ------------- | - |
| **SITE_NAME \*** | **string($string)** | ***(query)*** |   |

The publish name of the site whose menus are requested.

| **authorization \*** | **string($string)** | ***(header)*** |   |
| -------------------- | ------------------- | -------------- | - |

The JWT access token.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "publishUrl": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "menuNames": [
    {
      "language": "string",
      "name": "string"
    }
  ]
}
```

| *No links* |
| ---------- |

### Published menu dates, version 1 (default)

**GET**

**/publicmenu/dates/{SITE_NAME}/?menu={MENU_NAME}&dates={DATE1,DATE2...}**

Get a published menu of site.

#### Parameters

| **Name**         | **Description**     |               |   |
| :--------------- | :------------------ | ------------- | - |
| **SITE_NAME \*** | **string($string)** | ***(query)*** |   |

The publish name of the site.

| **MENU_NAME \*** | **string($string)** | ***(query)*** |   |
| ---------------- | ------------------- | ------------- | - |

The publish name of the menu.

| **dates \*** | **string($string)** | ***(query)*** |   |
| ------------ | ------------------- | ------------- | - |

The dates to be returned. Comma separated list of dates in format YYYY-MM-DD.

| **authorization \*** | **string($string)** | ***(header)*** |   |
| -------------------- | ------------------- | -------------- | - |

The JWT access token.

#### Responses

| **Code** | **Description** | **Links**            |                           |
| :------- | :-------------- | :------------------- | ------------------------- |
| 200      | Media type      | **application/json** | Controls `Accept` header. |

- **Example Value**
- Schema

```json
{
  "menuId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "siteId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "date": "string",
  "version": 0,
  "mealOptions": [
    {
      "names": [
        {
          "language": "string",
          "name": "string"
        }
      ],
      "prices": [
        {
          "names": [
            {
              "language": "string",
              "name": "string"
            }
          ],
          "priceExclTax": "string",
          "priceInclTax": "string",
          "priceTaxPercent": "string"
        }
      ],
      "rows": [
        {
          "names": [
            {
              "language": "string",
              "name": "string"
            }
          ],
          "allergens": [
            {
              "language": "string",
              "allergens": [
                "string"
              ]
            }
          ],
          "diets": [
            {
              "language": "string",
              "diets": [
                "string"
              ],
              "dietShorts": [
                "string"
              ]
            }
          ],
          "ingredients": [
            {
              "language": "string",
              "ingredients": "string"
            }
          ],
          "publicInfos": [
            {
              "language": "string",
              "publicInfos": "string"
            }
          ],
          "co2Value": [
            {
              "valuePerPortionInKg": "string",
              "ranges": [
                {
                  "name": "string",
                  "min": "string",
                  "max": "string",
                  "color": "string"
                }
              ]
            }
          ],
          "nutritiveItems": {
            "portionSize": 0,
            "portionUnitOfMeasurementNames": [
              {
                "language": "string",
                "name": "string"
              }
            ],
            "factors": [
              {
                "nutritiveFactorNames": [
                  {
                    "language": "string",
                    "name": "string"
                  }
                ],
                "values": [
                  {
                    "language": "string",
                    "value": "string",
                    "value100": "string"
                  }
                ],
                "mainGroupCode": "string",
                "factorOrder": "string",
                "energyContent": "string",
                "energyProportion": "string",
                "compareProportion": "string"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

| *No links* |
| ---------- |

#### Schemas

**publicSiteProperty_v1_full{**

|   |
| - |

**}**

**language_v1_full{**

| **id**   | **[...]** |
| -------- | --------- |
| **name** | **[...]** |
| **code** | **[...]** |

**}**

**recipe_v1_full{**

| **id**          | **[...]**           |
| --------------- | ------------------- |
| **siteId**      | **[...]**           |
| **code**        | **[...]**           |
| **sizeBatch**   | **[...]**           |
| **numberBatch** | **[...]**           |
| **sizePortion** | **number($double)** |

**Portion size**

| **numberPortion** | **number($double)** |
| ----------------- | ------------------- |

**Number of portions**

| **lossServing** | **number($double)** |
| --------------- | ------------------- |

**Serving loss**

| **lossCooking** | **[...]** |
| --------------- | --------- |
| **createdAt**   | **[...]** |
| **updatedAt**   | **[...]** |
| **names**       | **[...]** |

**}**