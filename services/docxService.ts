
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ImageRun, HeightRule, VerticalAlign } from "docx";
import FileSaver from "file-saver";
import { DossierProfile, CaseHistoryProfile } from "../types";

// --- CONFIGURATION ---

// OPTION 1: Best for reliability/offline. 
// Convert your PNG to Base64 (online tool like https://www.base64-image.de/) and paste the string here.
// If this string is populated, the app will use it and skip the network fetch.
const LOGO_BASE64: string = ""; 

// OPTION 2: Network Fetch
const LOGO_URL_DIRECT = "https://adra.org.nz/wp-content/uploads/2021/08/ADRA-Horizontal-Logo.png";
// Using corsproxy.io which is often more reliable than allorigins for images
const LOGO_URL_PROXY = `https://corsproxy.io/?${encodeURIComponent(LOGO_URL_DIRECT)}`;

// --- HELPERS ---

const convertBase64ToUint8Array = (base64String: string): Uint8Array => {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Clean = base64String.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
  const binaryString = atob(base64Clean);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// 1x1 Transparent Pixel Fallback
const FALLBACK_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const getImageData = async (url: string, retries = 2): Promise<Uint8Array> => {
  // 1. Prefer Hardcoded Base64 if available
  if (LOGO_BASE64.length > 100) {
    try {
      return convertBase64ToUint8Array(LOGO_BASE64);
    } catch (e) {
      console.error("Invalid Base64 string provided", e);
    }
  }

  // 2. Try Fetching
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.warn(`Attempt ${i + 1} to load logo failed.`);
      // Short delay
      if (i < retries - 1) await new Promise(res => setTimeout(res, 500));
    }
  }

  // 3. Fail Gracefully to Fallback (prevents app crash)
  console.warn("Using fallback image due to network errors.");
  return convertBase64ToUint8Array(FALLBACK_IMAGE);
};

const FONT_HEADER = "Arial"; 
const FONT_BODY = "Arial Narrow";
const FONT_SIZE_NORMAL = 22; // 11pt
const FONT_SIZE_LABEL = 22;

const createFieldLine = (label: string, value: string) => {
  return new Paragraph({
    children: [
      new TextRun({ text: label + ": ", bold: true, font: FONT_BODY, size: FONT_SIZE_LABEL }),
      new TextRun({ text: value || "", font: FONT_BODY, size: FONT_SIZE_NORMAL }),
    ],
    spacing: { after: 100 },
  });
};

// Helper for splitting a row into two labeled values
const createSplitFieldRow = (label1: string, value1: string, label2: string, value2: string) => {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE },
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [createFieldLine(label1, value1)]
                    }),
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [createFieldLine(label2, value2)]
                    })
                ]
            })
        ]
    });
};

const createQuestionBlock = (question: string, answer: string) => {
  return new Paragraph({
    children: [
      new TextRun({ text: question + " ", bold: true, font: FONT_BODY, size: FONT_SIZE_LABEL }),
      new TextRun({ text: answer || "", font: FONT_BODY, size: FONT_SIZE_NORMAL }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200 },
  });
};

const createHeaderTable = (imageBytes: Uint8Array, title: string) => {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: imageBytes,
                                        transformation: {
                                            width: 150,
                                            height: 50,
                                        },
                                        type: "png",
                                    }),
                                ]
                            })
                        ]
                    }),
                    new TableCell({
                        verticalAlign: VerticalAlign.BOTTOM,
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ 
                                        text: "Adventist Development and Relief Agency Bangladesh", 
                                        bold: true, 
                                        size: 24, // 12pt
                                        font: FONT_HEADER 
                                    }),
                                ],
                                spacing: { after: 100 }
                            })
                        ]
                    })
                ]
            })
        ]
    });
};

const sanitizeFilename = (aid: string, name: string) => {
    const sanitize = (input: string | undefined) => {
        if (!input) return "";
        return input.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();
    };
    return `${sanitize(aid) || "AID"} - ${sanitize(name) || "Child"}.docx`;
};


// --- APR GENERATOR ---

export const generateDossierDocx = async (data: DossierProfile) => {
  const imageBytes = await getImageData(LOGO_URL_PROXY);

  const doc = new Document({
    sections: [
      {
        properties: {
            page: { margin: { top: 500, right: 720, bottom: 500, left: 720 } },
        },
        children: [
          createHeaderTable(imageBytes, "Child Annual Progress Report (APR) 2025"),
          
          new Paragraph({
            text: "Child Annual Progress Report (APR) 2025",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            run: { bold: true, size: 28, font: FONT_HEADER, color: "000000" }
          }),

          new Paragraph({
             children: [
                 new TextRun({ text: "Name of School: ", bold: true, font: FONT_BODY, size: FONT_SIZE_LABEL }),
                 new TextRun({ text: data.schoolName, bold: true, font: FONT_BODY, size: FONT_SIZE_NORMAL }),
             ],
             spacing: { after: 200 }
          }),

          // 3-Column Layout: Left Data | Middle Data | Picture Box
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  // Column 1
                  new TableCell({
                    width: { size: 37, type: WidthType.PERCENTAGE },
                    children: [
                        createFieldLine("Name of Child", data.childName),
                        createFieldLine("Date of Birth", data.dob),
                        createFieldLine("Sponsorship Category", data.sponsorshipCategory),
                        createFieldLine("Gender", data.gender),
                        createFieldLine("Height", data.height + (data.height ? " cm" : "")),
                        createFieldLine("Personality", data.personality),
                        createFieldLine("Father's Name", data.fathersName),
                        createFieldLine("Father's Status", data.fathersStatus),
                        createFieldLine("Family Income Source", data.familyIncomeSource),
                    ],
                  }),
                  // Column 2
                  new TableCell({
                    width: { size: 37, type: WidthType.PERCENTAGE },
                    children: [
                        createFieldLine("Aid No", data.aidNo),
                        createFieldLine("Donor Agency", data.donorAgency),
                        createFieldLine("Aim in Life", data.aimInLife),
                        createFieldLine("Grade", data.grade),
                        createFieldLine("Weight", data.weight + (data.weight ? " kg" : "")),
                        createFieldLine("Academic Year", data.academicYear),
                        createFieldLine("Mother's Name", data.mothersName),
                        createFieldLine("Mother's Status", data.mothersStatus),
                        createFieldLine("Monthly Income (BDT)", data.monthlyIncome),
                    ],
                  }),
                  // Column 3: Picture
                  new TableCell({
                    width: { size: 26, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.TOP,
                    children: [
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    height: { value: 3600, rule: HeightRule.EXACT },
                                    children: [
                                        new TableCell({
                                            children: [],
                                            borders: {
                                                top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                                                bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                                                left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                                                right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                                            }
                                        })
                                    ]
                                })
                            ]
                        }),
                        new Paragraph({
                            text: "Picture",
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 100 },
                            run: { font: FONT_BODY, size: 20 }
                        })
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 200 } }),
          createQuestionBlock("Write about yourself and your future:", data.aboutSelfAndFuture),
          createQuestionBlock("Write a brief description about your home in the village and surroundings:", data.homeDescription),
          createQuestionBlock("Give a short description of your school and of the study environment:", data.schoolDescription),
          createQuestionBlock("What interesting story/experience has happened in your life/family?", data.interestingStory),
          new Paragraph({ text: "", spacing: { after: 200 } }),
          createQuestionBlock("Teacher's remarks about the child:", data.teachersRemarks),
          new Paragraph({ text: "", spacing: { after: 600 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Prepared By: ", bold: true, font: FONT_BODY, size: FONT_SIZE_NORMAL }),
                                new TextRun({ text: data.preparedBy, font: FONT_BODY, size: FONT_SIZE_NORMAL })
                            ]
                        })
                    ],
                  }),
                  new TableCell({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Prepared Date: ", bold: true, font: FONT_BODY, size: FONT_SIZE_NORMAL }),
                                new TextRun({ text: data.preparedDate, font: FONT_BODY, size: FONT_SIZE_NORMAL })
                            ],
                            alignment: AlignmentType.RIGHT
                        })
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  FileSaver.saveAs(blob, sanitizeFilename(data.aidNo, data.childName));
};

// --- CASE HISTORY GENERATOR ---

export const generateCaseHistoryDocx = async (data: CaseHistoryProfile) => {
    const imageBytes = await getImageData(LOGO_URL_PROXY);
  
    const doc = new Document({
      sections: [
        {
          properties: {
              page: { margin: { top: 500, right: 720, bottom: 500, left: 720 } },
          },
          children: [
            createHeaderTable(imageBytes, "Child Sponsorship Profile/Case History"),
            
            new Paragraph({
              text: "Child Sponsorship Profile/Case History",
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 300 },
              run: { bold: true, size: 28, font: FONT_HEADER, color: "000000" }
            }),
  
            // Main Layout Table: Left Info (70%) | Right Picture (30%)
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    // --- Left Column (Text Fields) ---
                    new TableCell({
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      children: [
                          createFieldLine("Name of Child", data.childName),
                          createFieldLine("Name of School", data.schoolName),
                          
                          // Code/Aid No & Donor - Two Column Nested Table
                          createSplitFieldRow("Code / Aid No", data.aidNo, "Donor Agency", data.donorAgency),
                          createSplitFieldRow("Sponsorship Category", data.sponsorshipCategory, "Aim in Life", data.aimInLife),
                          createSplitFieldRow("Date of Birth", data.dob, "Birth Place", data.birthPlace),
                          createSplitFieldRow("Gender", data.gender, "Grade", data.grade),
                          createSplitFieldRow("Height", data.height + " cm", "Weight", data.weight + " kg"),
                          createSplitFieldRow("Language Known", data.languageKnown, "Hobby", data.hobby),

                          createFieldLine("Father's Name", data.fathersName),
                          createFieldLine("Mother's Name", data.mothersName),
                          createFieldLine("Literacy of Father", data.fatherLiteracy),
                          createFieldLine("Literacy of Mother", data.motherLiteracy),

                          new Paragraph({
                            children: [
                              new TextRun({ text: "Siblings: ", bold: true, font: FONT_BODY, size: FONT_SIZE_LABEL }),
                              new TextRun({ text: "S- ", font: FONT_BODY, size: FONT_SIZE_NORMAL }),
                              new TextRun({ text: `${data.siblingsSisters || '_'}`, font: FONT_BODY, size: FONT_SIZE_NORMAL }),
                              new TextRun({ text: " , B- ", font: FONT_BODY, size: FONT_SIZE_NORMAL }),
                              new TextRun({ text: `${data.siblingsBrothers || '_'}`, font: FONT_BODY, size: FONT_SIZE_NORMAL }),
                            ],
                            spacing: { after: 100 },
                          }),

                          createSplitFieldRow("Family Income Source", data.familyIncomeSource, "Monthly Income (BDT)", data.monthlyIncome),
                      ],
                    }),
                    // --- Right Column (Picture) ---
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.TOP,
                      children: [
                          new Table({
                              width: { size: 100, type: WidthType.PERCENTAGE },
                              rows: [
                                  new TableRow({
                                      height: { value: 4500, rule: HeightRule.EXACT }, 
                                      children: [
                                          new TableCell({
                                              children: [],
                                              borders: {
                                                  top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                                                  bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                                                  left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                                                  right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                                              }
                                          })
                                      ]
                                  })
                              ]
                          }),
                          new Paragraph({
                              text: "Profile Picture",
                              alignment: AlignmentType.CENTER,
                              spacing: { before: 100 },
                              run: { font: FONT_BODY, size: 20 }
                          })
                      ],
                    }),
                  ],
                }),
              ],
            }),
  
            new Paragraph({ text: "", spacing: { after: 300 } }),
  
            createQuestionBlock("Child Profile:", data.childProfile),
            createQuestionBlock("Family Background:", data.familyBackground),
  
            new Paragraph({ text: "", spacing: { after: 800 } }),
  
            // Footer
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                          new Paragraph({
                              children: [
                                  new TextRun({ text: "Prepared By (Name): ", bold: true, font: FONT_BODY, size: FONT_SIZE_NORMAL }),
                                  new TextRun({ text: data.preparedBy, font: FONT_BODY, size: FONT_SIZE_NORMAL })
                              ]
                          })
                      ],
                    }),
                    new TableCell({
                      children: [
                          new Paragraph({
                              children: [
                                  new TextRun({ text: "Prepared Date: ", bold: true, font: FONT_BODY, size: FONT_SIZE_NORMAL }),
                                  new TextRun({ text: data.preparedDate, font: FONT_BODY, size: FONT_SIZE_NORMAL })
                              ],
                              alignment: AlignmentType.RIGHT
                          })
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });
  
    const blob = await Packer.toBlob(doc);
    FileSaver.saveAs(blob, sanitizeFilename(data.aidNo, data.childName));
};
