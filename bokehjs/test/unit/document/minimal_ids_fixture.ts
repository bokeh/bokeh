import type {DocJson} from "@bokehjs/document"

export type RootFixture = {
  key: string
  index: number
}

export type MinimalIDFixture = {
  name: string
  roots: RootFixture[]
  document: DocJson
}

export type MinimalIDFixtureData = {
  schema: string
  cases: MinimalIDFixture[]
}

// Keep this as strict JSON: the Python fixture test reads the same payload.
export const fixture_data = JSON.parse(String.raw`{
  "schema": "bokeh.embed.minimal-id-fixtures/v1",
  "cases": [
    {
      "name": "keyed-static-graph",
      "roots": [
        {
          "key": "primary",
          "index": 0
        },
        {
          "key": "secondary",
          "index": 1
        }
      ],
      "document": {
        "version": "__VERSION__",
        "title": "Bokeh Application",
        "config": {
          "type": "object",
          "name": "DocumentConfig",
          "attributes": {
            "notifications": {
              "type": "object",
              "name": "Notifications"
            }
          }
        },
        "roots": [
          {
            "type": "object",
            "name": "CustomJS",
            "attributes": {
              "args": {
                "type": "map",
                "entries": [
                  [
                    "anonymous",
                    {
                      "type": "object",
                      "name": "CustomJS",
                      "attributes": {
                        "code": "anonymous"
                      }
                    }
                  ],
                  [
                    "shared",
                    {
                      "type": "object",
                      "name": "CustomJS",
                      "id": "shared-callback",
                      "attributes": {
                        "code": "shared"
                      }
                    }
                  ],
                  [
                    "cycle",
                    {
                      "type": "object",
                      "name": "CustomJS",
                      "id": "cycle-a",
                      "attributes": {
                        "args": {
                          "type": "map",
                          "entries": [
                            [
                              "other",
                              {
                                "type": "object",
                                "name": "CustomJS",
                                "id": "cycle-b",
                                "attributes": {
                                  "args": {
                                    "type": "map",
                                    "entries": [
                                      [
                                        "other",
                                        {
                                          "id": "cycle-a"
                                        }
                                      ]
                                    ]
                                  },
                                  "code": "cycle-b"
                                }
                              }
                            ]
                          ]
                        },
                        "code": "cycle-a"
                      }
                    }
                  ]
                ]
              },
              "code": "primary"
            }
          },
          {
            "type": "object",
            "name": "CustomJS",
            "attributes": {
              "args": {
                "type": "map",
                "entries": [
                  [
                    "shared",
                    {
                      "id": "shared-callback"
                    }
                  ]
                ]
              },
              "code": "secondary"
            }
          }
        ]
      }
    }
  ]
}`) as MinimalIDFixtureData
