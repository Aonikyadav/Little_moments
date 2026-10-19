/**
 * Template Image Mapping & Resolver Utility
 *
 * Exclusively derives all image paths from the local 'Images' folder structure.
 * Provides a robust resolver that maps any template ID (such as 'tmpl-001', 'tmpl-user-001',
 * or numeric index) to its corresponding physical authentic asset in the 3 provided sub-folders:
 *   - /Images/#cool #animated #romantic
 *   - /Images/#propose #love #greeting #years #birthday
 *   - /Images/#romantic #love #kisspose #asthetic
 *
 * Guarantees that only authentic user covers/images are displayed across the entire app.
 */

export interface TemplateImageAsset {
  index: number
  templateId: string
  shortId: string
  numericId: string
  folder: string
  fileName: string
  localPath: string
  encodedUrl: string
  count: number
  category: string
  title: string
  tags: string[]
  allCandidateUrls: string[]
}

export type TemplateImageMapping = TemplateImageAsset

/**
 * Registry of all 61 physical authentic assets from the local Images/ sub-folders
 */
export const PHYSICAL_ASSETS: TemplateImageAsset[] = [
  {
    "index": 1,
    "templateId": "tmpl-user-001",
    "shortId": "tmpl-001",
    "numericId": "1",
    "folder": "#cool #animated #romantic",
    "fileName": "#1 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#1 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #fun.jpg",
    "encodedUrl": "/covers/cover-001.jpg",
    "count": 1,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated fun · 1-Cut Solo",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "1",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-001.jpg",
      "/templates/tmpl-user-001.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%231%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23fun.jpg",
      "/images/cool_animated_romantic/001.jpg",
      "/templates/%231%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23fun.jpg"
    ]
  },
  {
    "index": 2,
    "templateId": "tmpl-user-002",
    "shortId": "tmpl-002",
    "numericId": "2",
    "folder": "#cool #animated #romantic",
    "fileName": "#1 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun #story.jpg",
    "localPath": "/images/#cool #animated #romantic/#1 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun #story.jpg",
    "encodedUrl": "/covers/cover-002.jpg",
    "count": 1,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink spider fun story · 1-Cut Solo",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "1",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "pink",
      "spider",
      "fun",
      "story"
    ],
    "allCandidateUrls": [
      "/covers/cover-002.jpg",
      "/templates/tmpl-user-002.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%231%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun%20%23story.jpg",
      "/images/cool_animated_romantic/002.jpg",
      "/templates/%231%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun%20%23story.jpg"
    ]
  },
  {
    "index": 3,
    "templateId": "tmpl-user-003",
    "shortId": "tmpl-003",
    "numericId": "3",
    "folder": "#cool #animated #romantic",
    "fileName": "#1 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#1 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun.jpg",
    "encodedUrl": "/covers/cover-003.jpg",
    "count": 1,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink spider fun · 1-Cut Solo",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "1",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "pink",
      "spider",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-003.jpg",
      "/templates/tmpl-user-003.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%231%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun.jpg",
      "/images/cool_animated_romantic/003.jpg",
      "/templates/%231%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun.jpg"
    ]
  },
  {
    "index": 4,
    "templateId": "tmpl-user-004",
    "shortId": "tmpl-004",
    "numericId": "4",
    "folder": "#cool #animated #romantic",
    "fileName": "#1 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #spider #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#1 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #spider #fun.jpg",
    "encodedUrl": "/covers/cover-004.jpg",
    "count": 1,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated spider fun · 1-Cut Solo",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "1",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "spider",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-004.jpg",
      "/templates/tmpl-user-004.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%231%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23spider%20%23fun.jpg",
      "/images/cool_animated_romantic/004.jpg",
      "/templates/%231%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23spider%20%23fun.jpg"
    ]
  },
  {
    "index": 5,
    "templateId": "tmpl-user-005",
    "shortId": "tmpl-005",
    "numericId": "5",
    "folder": "#cool #animated #romantic",
    "fileName": "#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated  #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated  #fun.jpg",
    "encodedUrl": "/covers/cover-005.jpg",
    "count": 3,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated fun · 3-Cut Strip",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "3",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-005.jpg",
      "/templates/tmpl-user-005.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%20%23fun.jpg",
      "/images/cool_animated_romantic/005.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%20%23fun.jpg"
    ]
  },
  {
    "index": 6,
    "templateId": "tmpl-user-006",
    "shortId": "tmpl-006",
    "numericId": "6",
    "folder": "#cool #animated #romantic",
    "fileName": "#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun #story.jpg",
    "localPath": "/images/#cool #animated #romantic/#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun #story.jpg",
    "encodedUrl": "/covers/cover-006.jpg",
    "count": 3,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink spider fun story · 3-Cut Strip",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "3",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "pink",
      "spider",
      "fun",
      "story"
    ],
    "allCandidateUrls": [
      "/covers/cover-006.jpg",
      "/templates/tmpl-user-006.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun%20%23story.jpg",
      "/images/cool_animated_romantic/006.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun%20%23story.jpg"
    ]
  },
  {
    "index": 7,
    "templateId": "tmpl-user-007",
    "shortId": "tmpl-007",
    "numericId": "7",
    "folder": "#cool #animated #romantic",
    "fileName": "#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun.jpg",
    "encodedUrl": "/covers/cover-007.jpg",
    "count": 3,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink spider fun · 3-Cut Strip",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "3",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "pink",
      "spider",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-007.jpg",
      "/templates/tmpl-user-007.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun.jpg",
      "/images/cool_animated_romantic/007.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun.jpg"
    ]
  },
  {
    "index": 8,
    "templateId": "tmpl-user-008",
    "shortId": "tmpl-008",
    "numericId": "8",
    "folder": "#cool #animated #romantic",
    "fileName": "#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #spider #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #spider #fun.jpg",
    "encodedUrl": "/covers/cover-008.jpg",
    "count": 3,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated spider fun · 3-Cut Strip",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "3",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "spider",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-008.jpg",
      "/templates/tmpl-user-008.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23spider%20%23fun.jpg",
      "/images/cool_animated_romantic/008.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23spider%20%23fun.jpg"
    ]
  },
  {
    "index": 9,
    "templateId": "tmpl-user-009",
    "shortId": "tmpl-009",
    "numericId": "9",
    "folder": "#cool #animated #romantic",
    "fileName": "#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated.jpg",
    "localPath": "/images/#cool #animated #romantic/#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated.jpg",
    "encodedUrl": "/covers/cover-009.jpg",
    "count": 3,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated · 3-Cut Strip",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "3",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute"
    ],
    "allCandidateUrls": [
      "/covers/cover-009.jpg",
      "/templates/tmpl-user-009.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated.jpg",
      "/images/cool_animated_romantic/009.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated.jpg"
    ]
  },
  {
    "index": 10,
    "templateId": "tmpl-user-010",
    "shortId": "tmpl-010",
    "numericId": "10",
    "folder": "#cool #animated #romantic",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun.jpg",
    "encodedUrl": "/covers/cover-010.jpg",
    "count": 4,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink spider fun · 4-Cut Strip",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "4",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "pink",
      "spider",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-010.jpg",
      "/templates/tmpl-user-010.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun.jpg",
      "/images/cool_animated_romantic/010.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun.jpg"
    ]
  },
  {
    "index": 11,
    "templateId": "tmpl-user-011",
    "shortId": "tmpl-011",
    "numericId": "11",
    "folder": "#cool #animated #romantic",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #spider #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #spider #fun.jpg",
    "encodedUrl": "/covers/cover-011.jpg",
    "count": 4,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated spider fun · 4-Cut Strip",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "4",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "spider",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-011.jpg",
      "/templates/tmpl-user-011.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23spider%20%23fun.jpg",
      "/images/cool_animated_romantic/011.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23spider%20%23fun.jpg"
    ]
  },
  {
    "index": 12,
    "templateId": "tmpl-user-012",
    "shortId": "tmpl-012",
    "numericId": "12",
    "folder": "#cool #animated #romantic",
    "fileName": "#5 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#5 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun.jpg",
    "encodedUrl": "/covers/cover-012.jpg",
    "count": 5,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink spider fun · 5-Cut Collage",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "5",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "pink",
      "spider",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-012.jpg",
      "/templates/tmpl-user-012.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%235%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun.jpg",
      "/images/cool_animated_romantic/012.jpg",
      "/templates/%235%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun.jpg"
    ]
  },
  {
    "index": 13,
    "templateId": "tmpl-user-013",
    "shortId": "tmpl-013",
    "numericId": "13",
    "folder": "#cool #animated #romantic",
    "fileName": "#5 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink.jpg",
    "localPath": "/images/#cool #animated #romantic/#5 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink.jpg",
    "encodedUrl": "/covers/cover-013.jpg",
    "count": 5,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink · 5-Cut Collage",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "5",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "pink"
    ],
    "allCandidateUrls": [
      "/covers/cover-013.jpg",
      "/templates/tmpl-user-013.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%235%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink.jpg",
      "/images/cool_animated_romantic/013.jpg",
      "/templates/%235%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink.jpg"
    ]
  },
  {
    "index": 14,
    "templateId": "tmpl-user-014",
    "shortId": "tmpl-014",
    "numericId": "14",
    "folder": "#cool #animated #romantic",
    "fileName": "#5 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #spider #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#5 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #spider #fun.jpg",
    "encodedUrl": "/covers/cover-014.jpg",
    "count": 5,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated spider fun · 5-Cut Collage",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "5",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "spider",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-014.jpg",
      "/templates/tmpl-user-014.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%235%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23spider%20%23fun.jpg",
      "/images/cool_animated_romantic/014.jpg",
      "/templates/%235%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23spider%20%23fun.jpg"
    ]
  },
  {
    "index": 15,
    "templateId": "tmpl-user-015",
    "shortId": "tmpl-015",
    "numericId": "15",
    "folder": "#cool #animated #romantic",
    "fileName": "#6 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink  #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#6 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink  #fun.jpg",
    "encodedUrl": "/covers/cover-015.jpg",
    "count": 6,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink fun · 6-Cut Collage",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "6",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "pink",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-015.jpg",
      "/templates/tmpl-user-015.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%236%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%20%23fun.jpg",
      "/images/cool_animated_romantic/015.jpg",
      "/templates/%236%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%20%23fun.jpg"
    ]
  },
  {
    "index": 16,
    "templateId": "tmpl-user-016",
    "shortId": "tmpl-016",
    "numericId": "16",
    "folder": "#cool #animated #romantic",
    "fileName": "#6 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #spider #fun.jpg",
    "localPath": "/images/#cool #animated #romantic/#6 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #spider #fun.jpg",
    "encodedUrl": "/covers/cover-016.jpg",
    "count": 6,
    "category": "Cool & Spider Animated 🕸️",
    "title": "love romantic kiss pose couple ♡ blur cute animated spider fun · 6-Cut Collage",
    "tags": [
      "cool",
      "animated",
      "romantic",
      "6",
      "love",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "spider",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-016.jpg",
      "/templates/tmpl-user-016.jpg",
      "/images/%23cool%20%23animated%20%23romantic/%236%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23spider%20%23fun.jpg",
      "/images/cool_animated_romantic/016.jpg",
      "/templates/%236%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23spider%20%23fun.jpg"
    ]
  },
  {
    "index": 17,
    "templateId": "tmpl-user-017",
    "shortId": "tmpl-017",
    "numericId": "17",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#1 #asthetic.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#1 #asthetic.jpg",
    "encodedUrl": "/covers/cover-017.jpg",
    "count": 1,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "asthetic · 1-Cut Solo",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "1",
      "asthetic"
    ],
    "allCandidateUrls": [
      "/covers/cover-017.jpg",
      "/templates/tmpl-user-017.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%231%20%23asthetic.jpg",
      "/images/propose_love_greeting_years_birthday/017.jpg",
      "/templates/%231%20%23asthetic.jpg"
    ]
  },
  {
    "index": 18,
    "templateId": "tmpl-user-018",
    "shortId": "tmpl-018",
    "numericId": "18",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#1 #love #birthday.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#1 #love #birthday.jpg",
    "encodedUrl": "/covers/cover-018.jpg",
    "count": 1,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "love birthday · 1-Cut Solo",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "1"
    ],
    "allCandidateUrls": [
      "/covers/cover-018.jpg",
      "/templates/tmpl-user-018.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%231%20%23love%20%23birthday.jpg",
      "/images/propose_love_greeting_years_birthday/018.jpg",
      "/templates/%231%20%23love%20%23birthday.jpg"
    ]
  },
  {
    "index": 19,
    "templateId": "tmpl-user-019",
    "shortId": "tmpl-019",
    "numericId": "19",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#11 #love #birthday.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#11 #love #birthday.jpg",
    "encodedUrl": "/covers/cover-019.jpg",
    "count": 11,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "love birthday · 11-Cut Collage",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "11"
    ],
    "allCandidateUrls": [
      "/covers/cover-019.jpg",
      "/templates/tmpl-user-019.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%2311%20%23love%20%23birthday.jpg",
      "/images/propose_love_greeting_years_birthday/019.jpg",
      "/templates/%2311%20%23love%20%23birthday.jpg"
    ]
  },
  {
    "index": 20,
    "templateId": "tmpl-user-020",
    "shortId": "tmpl-020",
    "numericId": "20",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#2 #birthday.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#2 #birthday.jpg",
    "encodedUrl": "/covers/cover-020.jpg",
    "count": 2,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "birthday · 2-Cut Strip",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "2"
    ],
    "allCandidateUrls": [
      "/covers/cover-020.jpg",
      "/templates/tmpl-user-020.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%232%20%23birthday.jpg",
      "/images/propose_love_greeting_years_birthday/020.jpg",
      "/templates/%232%20%23birthday.jpg"
    ]
  },
  {
    "index": 21,
    "templateId": "tmpl-user-021",
    "shortId": "tmpl-021",
    "numericId": "21",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#2 #love #birthday #couple ♡.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#2 #love #birthday #couple ♡.jpg",
    "encodedUrl": "/covers/cover-021.jpg",
    "count": 2,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "love birthday couple ♡ · 2-Cut Strip",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "2",
      "couple"
    ],
    "allCandidateUrls": [
      "/covers/cover-021.jpg",
      "/templates/tmpl-user-021.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%232%20%23love%20%23birthday%20%23couple%20%E2%99%A1.jpg",
      "/images/propose_love_greeting_years_birthday/021.jpg",
      "/templates/%232%20%23love%20%23birthday%20%23couple%20%E2%99%A1.jpg"
    ]
  },
  {
    "index": 22,
    "templateId": "tmpl-user-022",
    "shortId": "tmpl-022",
    "numericId": "22",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#3 #animation #love.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#3 #animation #love.jpg",
    "encodedUrl": "/covers/cover-022.jpg",
    "count": 3,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "animation love · 3-Cut Strip",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "3",
      "animation"
    ],
    "allCandidateUrls": [
      "/covers/cover-022.jpg",
      "/templates/tmpl-user-022.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%233%20%23animation%20%23love.jpg",
      "/images/propose_love_greeting_years_birthday/022.jpg",
      "/templates/%233%20%23animation%20%23love.jpg"
    ]
  },
  {
    "index": 23,
    "templateId": "tmpl-user-023",
    "shortId": "tmpl-023",
    "numericId": "23",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#3 #asthetic.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#3 #asthetic.jpg",
    "encodedUrl": "/covers/cover-023.jpg",
    "count": 3,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "asthetic · 3-Cut Strip",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "3",
      "asthetic"
    ],
    "allCandidateUrls": [
      "/covers/cover-023.jpg",
      "/templates/tmpl-user-023.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%233%20%23asthetic.jpg",
      "/images/propose_love_greeting_years_birthday/023.jpg",
      "/templates/%233%20%23asthetic.jpg"
    ]
  },
  {
    "index": 24,
    "templateId": "tmpl-user-024",
    "shortId": "tmpl-024",
    "numericId": "24",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#3 #birthday.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#3 #birthday.jpg",
    "encodedUrl": "/covers/cover-024.jpg",
    "count": 3,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "birthday · 3-Cut Strip",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "3"
    ],
    "allCandidateUrls": [
      "/covers/cover-024.jpg",
      "/templates/tmpl-user-024.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%233%20%23birthday.jpg",
      "/images/propose_love_greeting_years_birthday/024.jpg",
      "/templates/%233%20%23birthday.jpg"
    ]
  },
  {
    "index": 25,
    "templateId": "tmpl-user-025",
    "shortId": "tmpl-025",
    "numericId": "25",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#3 #love #asthetic.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#3 #love #asthetic.jpg",
    "encodedUrl": "/covers/cover-025.jpg",
    "count": 3,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "love asthetic · 3-Cut Strip",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "3",
      "asthetic"
    ],
    "allCandidateUrls": [
      "/covers/cover-025.jpg",
      "/templates/tmpl-user-025.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%233%20%23love%20%23asthetic.jpg",
      "/images/propose_love_greeting_years_birthday/025.jpg",
      "/templates/%233%20%23love%20%23asthetic.jpg"
    ]
  },
  {
    "index": 26,
    "templateId": "tmpl-user-026",
    "shortId": "tmpl-026",
    "numericId": "26",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#3 #love #birthday #couple ♡.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#3 #love #birthday #couple ♡.jpg",
    "encodedUrl": "/covers/cover-026.jpg",
    "count": 3,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "love birthday couple ♡ · 3-Cut Strip",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "3",
      "couple"
    ],
    "allCandidateUrls": [
      "/covers/cover-026.jpg",
      "/templates/tmpl-user-026.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%233%20%23love%20%23birthday%20%23couple%20%E2%99%A1.jpg",
      "/images/propose_love_greeting_years_birthday/026.jpg",
      "/templates/%233%20%23love%20%23birthday%20%23couple%20%E2%99%A1.jpg"
    ]
  },
  {
    "index": 27,
    "templateId": "tmpl-user-027",
    "shortId": "tmpl-027",
    "numericId": "27",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#3 #love #letter #couple ♡.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#3 #love #letter #couple ♡.jpg",
    "encodedUrl": "/covers/cover-027.jpg",
    "count": 3,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "love letter couple ♡ · 3-Cut Strip",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "3",
      "letter",
      "couple"
    ],
    "allCandidateUrls": [
      "/covers/cover-027.jpg",
      "/templates/tmpl-user-027.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%233%20%23love%20%23letter%20%23couple%20%E2%99%A1.jpg",
      "/images/propose_love_greeting_years_birthday/027.jpg",
      "/templates/%233%20%23love%20%23letter%20%23couple%20%E2%99%A1.jpg"
    ]
  },
  {
    "index": 28,
    "templateId": "tmpl-user-028",
    "shortId": "tmpl-028",
    "numericId": "28",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #2year.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #2year.jpg",
    "encodedUrl": "/covers/cover-028.jpg",
    "count": 4,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink 2year · 4-Cut Strip",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "4",
      "romantic",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "animated",
      "pink",
      "2year"
    ],
    "allCandidateUrls": [
      "/covers/cover-028.jpg",
      "/templates/tmpl-user-028.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%232year.jpg",
      "/images/propose_love_greeting_years_birthday/028.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%232year.jpg"
    ]
  },
  {
    "index": 29,
    "templateId": "tmpl-user-029",
    "shortId": "tmpl-029",
    "numericId": "29",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#5 #love.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#5 #love.jpg",
    "encodedUrl": "/covers/cover-029.jpg",
    "count": 5,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "love · 5-Cut Collage",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "5"
    ],
    "allCandidateUrls": [
      "/covers/cover-029.jpg",
      "/templates/tmpl-user-029.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%235%20%23love.jpg",
      "/images/propose_love_greeting_years_birthday/029.jpg",
      "/templates/%235%20%23love.jpg"
    ]
  },
  {
    "index": 30,
    "templateId": "tmpl-user-030",
    "shortId": "tmpl-030",
    "numericId": "30",
    "folder": "#propose #love #greeting #years #birthday",
    "fileName": "#6 #love #propose #story #couple ♡.jpg",
    "localPath": "/images/#propose #love #greeting #years #birthday/#6 #love #propose #story #couple ♡.jpg",
    "encodedUrl": "/covers/cover-030.jpg",
    "count": 6,
    "category": "Propose & Birthday Keepsakes 🎂",
    "title": "love propose story couple ♡ · 6-Cut Collage",
    "tags": [
      "propose",
      "love",
      "greeting",
      "years",
      "birthday",
      "6",
      "story",
      "couple"
    ],
    "allCandidateUrls": [
      "/covers/cover-030.jpg",
      "/templates/tmpl-user-030.jpg",
      "/images/%23propose%20%23love%20%23greeting%20%23years%20%23birthday/%236%20%23love%20%23propose%20%23story%20%23couple%20%E2%99%A1.jpg",
      "/images/propose_love_greeting_years_birthday/030.jpg",
      "/templates/%236%20%23love%20%23propose%20%23story%20%23couple%20%E2%99%A1.jpg"
    ]
  },
  {
    "index": 31,
    "templateId": "tmpl-user-031",
    "shortId": "tmpl-031",
    "numericId": "31",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#1 #love #romantic #kiss #pose #couple ♡ #blur #birthday.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#1 #love #romantic #kiss #pose #couple ♡ #blur #birthday.jpg",
    "encodedUrl": "/covers/cover-031.jpg",
    "count": 1,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur birthday · 1-Cut Solo",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "1",
      "kiss",
      "pose",
      "couple",
      "blur",
      "birthday"
    ],
    "allCandidateUrls": [
      "/covers/cover-031.jpg",
      "/templates/tmpl-user-031.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%231%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23birthday.jpg",
      "/images/romantic_love_kisspose_aesthetic/031.jpg",
      "/templates/%231%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23birthday.jpg"
    ]
  },
  {
    "index": 32,
    "templateId": "tmpl-user-032",
    "shortId": "tmpl-032",
    "numericId": "32",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#2 #love #romantic #kiss #pose #aesthetic.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#2 #love #romantic #kiss #pose #aesthetic.jpg",
    "encodedUrl": "/covers/cover-032.jpg",
    "count": 2,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose aesthetic · 2-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "2",
      "kiss",
      "pose",
      "aesthetic"
    ],
    "allCandidateUrls": [
      "/covers/cover-032.jpg",
      "/templates/tmpl-user-032.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%232%20%23love%20%23romantic%20%23kiss%20%23pose%20%23aesthetic.jpg",
      "/images/romantic_love_kisspose_aesthetic/032.jpg",
      "/templates/%232%20%23love%20%23romantic%20%23kiss%20%23pose%20%23aesthetic.jpg"
    ]
  },
  {
    "index": 33,
    "templateId": "tmpl-user-033",
    "shortId": "tmpl-033",
    "numericId": "33",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#2 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#2 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink.jpg",
    "encodedUrl": "/covers/cover-033.jpg",
    "count": 2,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink · 2-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "2",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "animated",
      "pink"
    ],
    "allCandidateUrls": [
      "/covers/cover-033.jpg",
      "/templates/tmpl-user-033.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%232%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink.jpg",
      "/images/romantic_love_kisspose_aesthetic/033.jpg",
      "/templates/%232%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink.jpg"
    ]
  },
  {
    "index": 34,
    "templateId": "tmpl-user-034",
    "shortId": "tmpl-034",
    "numericId": "34",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#2 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#2 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated.jpg",
    "encodedUrl": "/covers/cover-034.jpg",
    "count": 2,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur cute animated · 2-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "2",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "animated"
    ],
    "allCandidateUrls": [
      "/covers/cover-034.jpg",
      "/templates/tmpl-user-034.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%232%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated.jpg",
      "/images/romantic_love_kisspose_aesthetic/034.jpg",
      "/templates/%232%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated.jpg"
    ]
  },
  {
    "index": 35,
    "templateId": "tmpl-user-035",
    "shortId": "tmpl-035",
    "numericId": "35",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#2 #love #romantic #kiss #pose #couple ♡ #blur #evileye🧿.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#2 #love #romantic #kiss #pose #couple ♡ #blur #evileye🧿.jpg",
    "encodedUrl": "/covers/cover-035.jpg",
    "count": 2,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur evileye🧿 · 2-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "2",
      "kiss",
      "pose",
      "couple",
      "blur",
      "evileye"
    ],
    "allCandidateUrls": [
      "/covers/cover-035.jpg",
      "/templates/tmpl-user-035.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%232%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23evileye%F0%9F%A7%BF.jpg",
      "/images/romantic_love_kisspose_aesthetic/035.jpg",
      "/templates/%232%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23evileye%F0%9F%A7%BF.jpg"
    ]
  },
  {
    "index": 36,
    "templateId": "tmpl-user-036",
    "shortId": "tmpl-036",
    "numericId": "36",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#3 #love #romantic #animated #couple ♡ #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#3 #love #romantic #animated #couple ♡ #fun.jpg",
    "encodedUrl": "/covers/cover-036.jpg",
    "count": 3,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic animated couple ♡ fun · 3-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "3",
      "animated",
      "couple",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-036.jpg",
      "/templates/tmpl-user-036.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%233%20%23love%20%23romantic%20%23animated%20%23couple%20%E2%99%A1%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/036.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23animated%20%23couple%20%E2%99%A1%20%23fun.jpg"
    ]
  },
  {
    "index": 37,
    "templateId": "tmpl-user-037",
    "shortId": "tmpl-037",
    "numericId": "37",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#3 #love #romantic #animated #dark #couple ♡ #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#3 #love #romantic #animated #dark #couple ♡ #fun.jpg",
    "encodedUrl": "/covers/cover-037.jpg",
    "count": 3,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic animated dark couple ♡ fun · 3-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "3",
      "animated",
      "dark",
      "couple",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-037.jpg",
      "/templates/tmpl-user-037.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%233%20%23love%20%23romantic%20%23animated%20%23dark%20%23couple%20%E2%99%A1%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/037.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23animated%20%23dark%20%23couple%20%E2%99%A1%20%23fun.jpg"
    ]
  },
  {
    "index": 38,
    "templateId": "tmpl-user-038",
    "shortId": "tmpl-038",
    "numericId": "38",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#3 #love #romantic #couple ♡ #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#3 #love #romantic #couple ♡ #fun.jpg",
    "encodedUrl": "/covers/cover-038.jpg",
    "count": 3,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic couple ♡ fun · 3-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "3",
      "couple",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-038.jpg",
      "/templates/tmpl-user-038.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%233%20%23love%20%23romantic%20%23couple%20%E2%99%A1%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/038.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23couple%20%E2%99%A1%20%23fun.jpg"
    ]
  },
  {
    "index": 39,
    "templateId": "tmpl-user-039",
    "shortId": "tmpl-039",
    "numericId": "39",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#3 #love #romantic #kiss #pose #couple ♡ #blur #animated #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#3 #love #romantic #kiss #pose #couple ♡ #blur #animated #fun.jpg",
    "encodedUrl": "/covers/cover-039.jpg",
    "count": 3,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur animated fun · 3-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "3",
      "kiss",
      "pose",
      "couple",
      "blur",
      "animated",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-039.jpg",
      "/templates/tmpl-user-039.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23animated%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/039.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23animated%20%23fun.jpg"
    ]
  },
  {
    "index": 40,
    "templateId": "tmpl-user-040",
    "shortId": "tmpl-040",
    "numericId": "40",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#3 #love #romantic #kiss #pose #couple ♡ #blur #basic.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#3 #love #romantic #kiss #pose #couple ♡ #blur #basic.jpg",
    "encodedUrl": "/covers/cover-040.jpg",
    "count": 3,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur basic · 3-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "3",
      "kiss",
      "pose",
      "couple",
      "blur",
      "basic"
    ],
    "allCandidateUrls": [
      "/covers/cover-040.jpg",
      "/templates/tmpl-user-040.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23basic.jpg",
      "/images/romantic_love_kisspose_aesthetic/040.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23basic.jpg"
    ]
  },
  {
    "index": 41,
    "templateId": "tmpl-user-041",
    "shortId": "tmpl-041",
    "numericId": "41",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #bestie.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #bestie.jpg",
    "encodedUrl": "/covers/cover-041.jpg",
    "count": 3,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink bestie · 3-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "3",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "animated",
      "pink",
      "bestie"
    ],
    "allCandidateUrls": [
      "/covers/cover-041.jpg",
      "/templates/tmpl-user-041.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23bestie.jpg",
      "/images/romantic_love_kisspose_aesthetic/041.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23bestie.jpg"
    ]
  },
  {
    "index": 42,
    "templateId": "tmpl-user-042",
    "shortId": "tmpl-042",
    "numericId": "42",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#3 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #fun.jpg",
    "encodedUrl": "/covers/cover-042.jpg",
    "count": 3,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink fun · 3-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "3",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "animated",
      "pink",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-042.jpg",
      "/templates/tmpl-user-042.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/042.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23fun.jpg"
    ]
  },
  {
    "index": 43,
    "templateId": "tmpl-user-043",
    "shortId": "tmpl-043",
    "numericId": "43",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#3 #love #romantic #kiss #pose #couple ♡ #blur #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#3 #love #romantic #kiss #pose #couple ♡ #blur #fun.jpg",
    "encodedUrl": "/covers/cover-043.jpg",
    "count": 3,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur fun · 3-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "3",
      "kiss",
      "pose",
      "couple",
      "blur",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-043.jpg",
      "/templates/tmpl-user-043.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/043.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23fun.jpg"
    ]
  },
  {
    "index": 44,
    "templateId": "tmpl-user-044",
    "shortId": "tmpl-044",
    "numericId": "44",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#3 #love #romantic #kiss #pose 🎀.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#3 #love #romantic #kiss #pose 🎀.jpg",
    "encodedUrl": "/covers/cover-044.jpg",
    "count": 3,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose 🎀 · 3-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "3",
      "kiss",
      "pose"
    ],
    "allCandidateUrls": [
      "/covers/cover-044.jpg",
      "/templates/tmpl-user-044.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%F0%9F%8E%80.jpg",
      "/images/romantic_love_kisspose_aesthetic/044.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23kiss%20%23pose%20%F0%9F%8E%80.jpg"
    ]
  },
  {
    "index": 45,
    "templateId": "tmpl-user-045",
    "shortId": "tmpl-045",
    "numericId": "45",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#3 #love #romantic #pose #couple ♡ #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#3 #love #romantic #pose #couple ♡ #fun.jpg",
    "encodedUrl": "/covers/cover-045.jpg",
    "count": 3,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic pose couple ♡ fun · 3-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "3",
      "pose",
      "couple",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-045.jpg",
      "/templates/tmpl-user-045.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%233%20%23love%20%23romantic%20%23pose%20%23couple%20%E2%99%A1%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/045.jpg",
      "/templates/%233%20%23love%20%23romantic%20%23pose%20%23couple%20%E2%99%A1%20%23fun.jpg"
    ]
  },
  {
    "index": 46,
    "templateId": "tmpl-user-046",
    "shortId": "tmpl-046",
    "numericId": "46",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #animated #couple ♡.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #animated #couple ♡.jpg",
    "encodedUrl": "/covers/cover-046.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic animated couple ♡ · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "animated",
      "couple"
    ],
    "allCandidateUrls": [
      "/covers/cover-046.jpg",
      "/templates/tmpl-user-046.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23animated%20%23couple%20%E2%99%A1.jpg",
      "/images/romantic_love_kisspose_aesthetic/046.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23animated%20%23couple%20%E2%99%A1.jpg"
    ]
  },
  {
    "index": 47,
    "templateId": "tmpl-user-047",
    "shortId": "tmpl-047",
    "numericId": "47",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #blur #animated #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #kiss #pose #couple ♡ #blur #animated #fun.jpg",
    "encodedUrl": "/covers/cover-047.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur animated fun · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "kiss",
      "pose",
      "couple",
      "blur",
      "animated",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-047.jpg",
      "/templates/tmpl-user-047.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23animated%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/047.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23animated%20%23fun.jpg"
    ]
  },
  {
    "index": 48,
    "templateId": "tmpl-user-048",
    "shortId": "tmpl-048",
    "numericId": "48",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #cat #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #cat #fun.jpg",
    "encodedUrl": "/covers/cover-048.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink cat fun · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "animated",
      "pink",
      "cat",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-048.jpg",
      "/templates/tmpl-user-048.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23cat%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/048.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23cat%20%23fun.jpg"
    ]
  },
  {
    "index": 49,
    "templateId": "tmpl-user-049",
    "shortId": "tmpl-049",
    "numericId": "49",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #spider #fun.jpg",
    "encodedUrl": "/covers/cover-049.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink spider fun · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "animated",
      "pink",
      "spider",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-049.jpg",
      "/templates/tmpl-user-049.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/049.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23spider%20%23fun.jpg"
    ]
  },
  {
    "index": 50,
    "templateId": "tmpl-user-050",
    "shortId": "tmpl-050",
    "numericId": "50",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #zootopia🍄#fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink #zootopia🍄#fun.jpg",
    "encodedUrl": "/covers/cover-050.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink zootopia🍄 fun · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "animated",
      "pink",
      "zootopia",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-050.jpg",
      "/templates/tmpl-user-050.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23zootopia%F0%9F%8D%84%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/050.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink%20%23zootopia%F0%9F%8D%84%23fun.jpg"
    ]
  },
  {
    "index": 51,
    "templateId": "tmpl-user-051",
    "shortId": "tmpl-051",
    "numericId": "51",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #kiss #pose #couple ♡ #blur #cute #animated #pink.jpg",
    "encodedUrl": "/covers/cover-051.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur cute animated pink · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "kiss",
      "pose",
      "couple",
      "blur",
      "cute",
      "animated",
      "pink"
    ],
    "allCandidateUrls": [
      "/covers/cover-051.jpg",
      "/templates/tmpl-user-051.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink.jpg",
      "/images/romantic_love_kisspose_aesthetic/051.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23cute%20%23animated%20%23pink.jpg"
    ]
  },
  {
    "index": 52,
    "templateId": "tmpl-user-052",
    "shortId": "tmpl-052",
    "numericId": "52",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #blur #dark #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #kiss #pose #couple ♡ #blur #dark #fun.jpg",
    "encodedUrl": "/covers/cover-052.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur dark fun · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "kiss",
      "pose",
      "couple",
      "blur",
      "dark",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-052.jpg",
      "/templates/tmpl-user-052.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23dark%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/052.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23dark%20%23fun.jpg"
    ]
  },
  {
    "index": 53,
    "templateId": "tmpl-user-053",
    "shortId": "tmpl-053",
    "numericId": "53",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #blur #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #kiss #pose #couple ♡ #blur #fun.jpg",
    "encodedUrl": "/covers/cover-053.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ blur fun · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "kiss",
      "pose",
      "couple",
      "blur",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-053.jpg",
      "/templates/tmpl-user-053.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/053.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23blur%20%23fun.jpg"
    ]
  },
  {
    "index": 54,
    "templateId": "tmpl-user-054",
    "shortId": "tmpl-054",
    "numericId": "54",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #bright #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #kiss #pose #couple ♡ #bright #fun.jpg",
    "encodedUrl": "/covers/cover-054.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ bright fun · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "kiss",
      "pose",
      "couple",
      "bright",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-054.jpg",
      "/templates/tmpl-user-054.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23bright%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/054.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23bright%20%23fun.jpg"
    ]
  },
  {
    "index": 55,
    "templateId": "tmpl-user-055",
    "shortId": "tmpl-055",
    "numericId": "55",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #kiss #pose #couple ♡ #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #kiss #pose #couple ♡ #fun.jpg",
    "encodedUrl": "/covers/cover-055.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose couple ♡ fun · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "kiss",
      "pose",
      "couple",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-055.jpg",
      "/templates/tmpl-user-055.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/055.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23couple%20%E2%99%A1%20%23fun.jpg"
    ]
  },
  {
    "index": 56,
    "templateId": "tmpl-user-056",
    "shortId": "tmpl-056",
    "numericId": "56",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #kiss #pose #dark #couple ♡ #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #kiss #pose #dark #couple ♡ #fun.jpg",
    "encodedUrl": "/covers/cover-056.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic kiss pose dark couple ♡ fun · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "kiss",
      "pose",
      "dark",
      "couple",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-056.jpg",
      "/templates/tmpl-user-056.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23dark%20%23couple%20%E2%99%A1%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/056.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23kiss%20%23pose%20%23dark%20%23couple%20%E2%99%A1%20%23fun.jpg"
    ]
  },
  {
    "index": 57,
    "templateId": "tmpl-user-057",
    "shortId": "tmpl-057",
    "numericId": "57",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #purple #kiss #couple ♡ #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #purple #kiss #couple ♡ #fun.jpg",
    "encodedUrl": "/covers/cover-057.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic purple kiss couple ♡ fun · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "purple",
      "kiss",
      "couple",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-057.jpg",
      "/templates/tmpl-user-057.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23purple%20%23kiss%20%23couple%20%E2%99%A1%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/057.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23purple%20%23kiss%20%23couple%20%E2%99%A1%20%23fun.jpg"
    ]
  },
  {
    "index": 58,
    "templateId": "tmpl-user-058",
    "shortId": "tmpl-058",
    "numericId": "58",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic #purple.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic #purple.jpg",
    "encodedUrl": "/covers/cover-058.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic purple · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4",
      "purple"
    ],
    "allCandidateUrls": [
      "/covers/cover-058.jpg",
      "/templates/tmpl-user-058.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic%20%23purple.jpg",
      "/images/romantic_love_kisspose_aesthetic/058.jpg",
      "/templates/%234%20%23love%20%23romantic%20%23purple.jpg"
    ]
  },
  {
    "index": 59,
    "templateId": "tmpl-user-059",
    "shortId": "tmpl-059",
    "numericId": "59",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#4 #love #romantic.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#4 #love #romantic.jpg",
    "encodedUrl": "/covers/cover-059.jpg",
    "count": 4,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic · 4-Cut Strip",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "4"
    ],
    "allCandidateUrls": [
      "/covers/cover-059.jpg",
      "/templates/tmpl-user-059.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%234%20%23love%20%23romantic.jpg",
      "/images/romantic_love_kisspose_aesthetic/059.jpg",
      "/templates/%234%20%23love%20%23romantic.jpg"
    ]
  },
  {
    "index": 60,
    "templateId": "tmpl-user-060",
    "shortId": "tmpl-060",
    "numericId": "60",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#6 #love #romantic #animated #pose #couple ♡ #fun.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#6 #love #romantic #animated #pose #couple ♡ #fun.jpg",
    "encodedUrl": "/covers/cover-060.jpg",
    "count": 6,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic animated pose couple ♡ fun · 6-Cut Collage",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "6",
      "animated",
      "pose",
      "couple",
      "fun"
    ],
    "allCandidateUrls": [
      "/covers/cover-060.jpg",
      "/templates/tmpl-user-060.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%236%20%23love%20%23romantic%20%23animated%20%23pose%20%23couple%20%E2%99%A1%20%23fun.jpg",
      "/images/romantic_love_kisspose_aesthetic/060.jpg",
      "/templates/%236%20%23love%20%23romantic%20%23animated%20%23pose%20%23couple%20%E2%99%A1%20%23fun.jpg"
    ]
  },
  {
    "index": 61,
    "templateId": "tmpl-user-061",
    "shortId": "tmpl-061",
    "numericId": "61",
    "folder": "#romantic #love #kisspose #asthetic",
    "fileName": "#8 #love #romantic #animated #pose #couple ♡.jpg",
    "localPath": "/images/#romantic #love #kisspose #asthetic/#8 #love #romantic #animated #pose #couple ♡.jpg",
    "encodedUrl": "/covers/cover-061.jpg",
    "count": 8,
    "category": "Romantic Kiss Pose Aesthetic ♡",
    "title": "love romantic animated pose couple ♡ · 8-Cut Collage",
    "tags": [
      "romantic",
      "love",
      "kisspose",
      "asthetic",
      "8",
      "animated",
      "pose",
      "couple"
    ],
    "allCandidateUrls": [
      "/covers/cover-061.jpg",
      "/templates/tmpl-user-061.jpg",
      "/images/%23romantic%20%23love%20%23kisspose%20%23asthetic/%238%20%23love%20%23romantic%20%23animated%20%23pose%20%23couple%20%E2%99%A1.jpg",
      "/images/romantic_love_kisspose_aesthetic/061.jpg",
      "/templates/%238%20%23love%20%23romantic%20%23animated%20%23pose%20%23couple%20%E2%99%A1.jpg"
    ]
  }
]

/**
 * Fast lookup dictionary by various ID formats (e.g. tmpl-001, tmpl-user-001, 1)
 */
export const ASSET_BY_ID: Record<string, TemplateImageAsset> = {}

PHYSICAL_ASSETS.forEach((asset) => {
  ASSET_BY_ID[asset.templateId] = asset
  ASSET_BY_ID[asset.shortId] = asset
  ASSET_BY_ID[asset.numericId] = asset
  ASSET_BY_ID[`tmpl-${asset.index}`] = asset
  ASSET_BY_ID[`tmpl-user-${asset.index}`] = asset
  ASSET_BY_ID[`tmpl-user-${String(asset.index).padStart(3, "0")}`] = asset
  ASSET_BY_ID[asset.fileName] = asset
})

// Common aliases fallback
ASSET_BY_ID["four-cut"] = PHYSICAL_ASSETS[0]
ASSET_BY_ID["tmpl-001"] = PHYSICAL_ASSETS[0]
ASSET_BY_ID["tmpl-grid-9"] = PHYSICAL_ASSETS[29] // asset #30

export const TEMPLATE_IMAGE_MAPPINGS: Record<string, TemplateImageAsset> = ASSET_BY_ID

/**
 * Robust Template Asset Resolver
 *
 * Maps any template ID (like 'tmpl-001', 'tmpl-user-001', '1', 'four-cut')
 * or template object to its corresponding physical asset in the local Images folder structure.
 */
export function resolveTemplateLocalAsset(
  input?: string | { id?: string; name?: string; category?: string } | null
): TemplateImageAsset {
  if (!input) {
    return PHYSICAL_ASSETS[0]
  }

  const rawId = typeof input === "string" ? input.trim() : (input.id || "").trim()

  // 1. Direct dictionary match
  if (rawId && ASSET_BY_ID[rawId]) {
    return ASSET_BY_ID[rawId]
  }

  // 2. Case-insensitive dictionary match
  const lowerId = rawId.toLowerCase()
  if (ASSET_BY_ID[lowerId]) {
    return ASSET_BY_ID[lowerId]
  }

  // 3. Extract numeric ID (e.g. "tmpl-001" -> 1, "tmpl-user-042" -> 42, "item-5" -> 5)
  const numMatch = rawId.match(/\d+/)
  if (numMatch) {
    const parsedNum = parseInt(numMatch[0], 10)
    if (!isNaN(parsedNum) && parsedNum > 0) {
      const zeroBasedIndex = ((parsedNum - 1) % PHYSICAL_ASSETS.length + PHYSICAL_ASSETS.length) % PHYSICAL_ASSETS.length
      return PHYSICAL_ASSETS[zeroBasedIndex]
    }
  }

  // 4. Match by category if available in object
  if (typeof input === "object" && input?.category) {
    const cat = input.category.toLowerCase()
    if (cat.includes("cool") || cat.includes("spider") || cat.includes("animated")) {
      return PHYSICAL_ASSETS[0] // Folder 1
    }
    if (cat.includes("propose") || cat.includes("birthday") || cat.includes("greeting")) {
      return PHYSICAL_ASSETS[16] // Folder 2
    }
    if (cat.includes("romantic") || cat.includes("kiss") || cat.includes("couple")) {
      return PHYSICAL_ASSETS[30] // Folder 3
    }
  }

  // 5. Deterministic string hash fallback to ensure consistent assignment
  let hash = 0
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash << 5) - hash + rawId.charCodeAt(i)
    hash |= 0
  }
  const hashIndex = Math.abs(hash) % PHYSICAL_ASSETS.length
  return PHYSICAL_ASSETS[hashIndex]
}

/**
 * Backward compatibility: getTemplateImageMapping
 */
export function getTemplateImageMapping(id: string): TemplateImageAsset {
  return resolveTemplateLocalAsset(id)
}

/**
 * Backward compatibility: getTemplateLocalImage
 * Returns the primary encoded URL exclusively from the local /covers or /images folder structure.
 */
export function getTemplateLocalImage(templateId: string, _legacyFallback?: string): string {
  const asset = resolveTemplateLocalAsset(templateId)
  return asset.encodedUrl
}

/**
 * Backward compatibility: getTemplateLocalImageCandidates
 * Returns candidate paths derived EXCLUSIVELY from the authentic image assets.
 */
export function getTemplateLocalImageCandidates(templateId: string, _legacyFallback?: string): string[] {
  const asset = resolveTemplateLocalAsset(templateId)
  return asset.allCandidateUrls
}

/**
 * List all physical image assets
 */
export function getAllTemplateImageMappings(): TemplateImageAsset[] {
  return PHYSICAL_ASSETS
}
