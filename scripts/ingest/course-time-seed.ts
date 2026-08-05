/**
 * Hand-curated community clear times, one row per source post.
 *
 * This is the reviewed baseline. Reddit search results are merged on top of it
 * at ingest, so a blocked or empty scrape degrades to this table rather than to
 * nothing. Times are keyed by course code, never by name: WGU reuses course
 * names across codes and the reported times differ sharply between them.
 *
 * `days` is elapsed calendar days as the poster described them, rounded up to a
 * whole day, and may come from a comment rather than the post itself. Omit
 * `days` when the post is worth reading but never states how long it took — it
 * then counts as a linked report with no number. One thread may appear under
 * several courses when it covers several, as the new-BSIT thread does.
 *
 * Rows carry no date. Ingest dates them from the search listings it already
 * holds, so a row only needs the link.
 *
 * Three rows from the original table are deliberately absent. The D683 and D459
 * entries cited posts about C683 and D335 respectively, so their times belonged
 * to different courses; ingest re-checks this for every row. C962 belongs to no
 * program we publish.
 */

export type CourseTimeSeed = {
  code: string;
  /** For human review only. Ingest warns when it disagrees with the catalog. */
  name: string;
  days?: number;
  url: string;
};

export const CURATED_COURSE_TIMES: CourseTimeSeed[] = [
  { code: "D326", name: "Advanced Data Management", days: 2, url: "https://www.reddit.com/r/WGU_CompSci/comments/1crzmif/d326_advanced_data_management_passed_in_2/" },
  { code: "D387", name: "Advanced Java", days: 14, url: "https://www.reddit.com/r/WGU/comments/18w0yx5/d387_advanced_java/" },
  { code: "E026", name: "AI for IT Automation and Security", days: 14, url: "https://www.reddit.com/r/WGU_BSCNE/comments/1rzdmd1/finished_e026_ai_for_it_automation_in_2_weeks/" },
  { code: "C963", name: "American Politics and the US Constitution", days: 3, url: "https://www.reddit.com/r/WGU/comments/tcwxxg/passed_c963_in_three_days/" },
  { code: "C957", name: "Applied Algebra", days: 3, url: "https://www.reddit.com/r/WGU/comments/1pwg1og/passed_applied_algebra_c957/" },
  { code: "C955", name: "Applied Probability and Statistics", days: 7, url: "https://www.reddit.com/r/WGU/comments/1gz1jlz/7_days_to_pass_c955_stats_and_probability_fire_me/" },
  { code: "D682", name: "Artificial Intelligence Optimization for Computer Scientists", days: 21, url: "https://www.reddit.com/r/WGU_CompSci/comments/1mcwbq3/wgu_d682_guide_task_1_ai_optimization/" },
  { code: "D319", name: "AWS Cloud Architecture", days: 30, url: "https://www.reddit.com/r/WGU/comments/1j00hto/d319_passed_on_first_try/" },
  { code: "D303", name: "Azure Fundamentals", days: 14, url: "https://www.reddit.com/r/WGU/comments/1scchw2/passed_d303_with_2_weeks_of_study_time/" },
  { code: "D288", name: "Back-End Programming", url: "https://www.reddit.com/r/WGU/comments/1cp7hj7/i_passed_d288_backend_programming_tips/" },
  { code: "D495", name: "Big Data Foundations", days: 14, url: "https://www.reddit.com/r/WGU/comments/1kspzhi/d495_big_data_task_1/" },
  { code: "D324", name: "Business of IT - Project Management", days: 7, url: "https://www.reddit.com/r/WGU/comments/1sec8ht/how_i_passed_d324_comptia_project_in_less_than_a/" },
  { code: "D336", name: "Business of IT – Applications", days: 3, url: "https://www.reddit.com/r/WGUIT/comments/1cgurqt/business_of_it_applications_d336_passed_in_3_days/" },
  { code: "C958", name: "Calculus I", days: 10, url: "https://www.reddit.com/r/WGU_CompSci/comments/1hq7h9i/passed_c958_my_tips/" },
  { code: "C721", name: "Change Management", days: 1, url: "https://www.reddit.com/r/WGU/comments/1rz8ali/change_management_c721_passed_tips_guide/" },
  { code: "E025", name: "Cloud and Network Security Models", days: 1, url: "https://www.reddit.com/r/WGU/comments/1nye2fv/cloud_and_network_security_modelse025/" },
  { code: "D318", name: "Cloud Applications", days: 6, url: "https://www.reddit.com/r/WGU/comments/zhcgnx/passed_d318_cloud_applications_cloud/" },
  { code: "D341", name: "Cloud Deployment and Operations", days: 28, url: "https://www.reddit.com/r/WGU/comments/19chz00/passed_cloud_deployment_and_operations_d341c924/" },
  { code: "D282", name: "Cloud Foundations", days: 2, url: "https://www.reddit.com/r/WGU/comments/1qox8jt/how_i_passed_the_aws_certified_cloud_practitioner/" },
  { code: "D338", name: "Cloud Platform Solutions", days: 7, url: "https://www.reddit.com/r/WGU/comments/1343h3a/d338_cloud_platform_solutions_passed_first_attempt/" },
  { code: "D270", name: "Composition: Successful Self-Expression", days: 4, url: "https://www.reddit.com/r/WGU/comments/1lchy57/d270_tips_and_tricks_passed_in_4_days/" },
  { code: "D269", name: "Composition: Writing with a Strategy", days: 3, url: "https://www.reddit.com/r/WGU/comments/1sdz3ny/wgu_composition_writing_with_a_strategy_d269/" },
  { code: "C952", name: "Computer Architecture", days: 10, url: "https://www.reddit.com/r/WGU/comments/1h4g4bn/c952_computer_architecture_passed_in_10_days/" },
  { code: "D687", name: "Computer Science Project Development with a Team", days: 60, url: "https://www.reddit.com/r/WGU_CompSci/comments/1i674zv/new_2025_cs_program_completion_more_in_comments/" },
  { code: "D265", name: "Critical Thinking: Reason and Evidence", days: 2, url: "https://www.reddit.com/r/WGU/comments/17uc62q/summary_critical_thinking_reason_and_evidence/" },
  { code: "D340", name: "Cyber Defense and Countermeasures", days: 7, url: "https://www.reddit.com/r/WGUCyberSecurity/comments/1q6jo8r/cysa_d340_passed/" },
  { code: "D414", name: "Cyber Operations Fundamentals", days: 7, url: "https://www.reddit.com/r/WGU/comments/1mekn83/d414_cyber_operations_fundamentals_passed_in_7/" },
  { code: "D498", name: "Data Analysis with R", days: 1, url: "https://www.reddit.com/r/WGU/comments/1rvsuti/d496_d497_d498_d499_d500_d501_udacity_nanodegree/" },
  { code: "D492", name: "Data Analytics - Applications", days: 14, url: "https://www.reddit.com/r/WGU/comments/1qia6gn/d492_comptia_data_da0002_passed/" },
  { code: "D502", name: "Data Analytics Capstone", days: 42, url: "https://www.reddit.com/r/WGU/comments/1iruqqa/d502_data_analytics_capstone/" },
  { code: "D494", name: "Data and Information Governance", days: 7, url: "https://www.reddit.com/r/WGU/comments/1faf776/passed_d494_data_and_information_governance/" },
  { code: "D427", name: "Data Management - Applications", days: 1, url: "https://www.reddit.com/r/WGU/comments/1kt41e6/d427_data_management_applications_new_version/" },
  { code: "D426", name: "Data Management - Foundations", days: 21, url: "https://www.reddit.com/r/WGU/comments/1nge6yb/d426_how_to_pass_2025v3/" },
  { code: "C949", name: "Data Structures and Algorithms I", days: 10, url: "https://www.reddit.com/r/WGU/comments/1ggr9i9/c949_data_structures_and_algorithms_passed/" },
  { code: "C950", name: "Data Structures and Algorithms II", days: 6, url: "https://www.reddit.com/r/WGU_CompSci/comments/1bdf53t/c950_data_structures_and_algorithms_ii_finished/" },
  { code: "D497", name: "Data Wrangling", days: 7, url: "https://www.reddit.com/r/WGU/comments/1jobype/d497_udacity_data_wrangling/" },
  { code: "D428", name: "Design Thinking for Business", days: 2, url: "https://www.reddit.com/r/WGU/comments/17b52cq/d428_design_thinking_for_business_review/" },
  { code: "E006", name: "Digital Transformation in the Enterprise", url: "https://www.reddit.com/r/WGUIT/comments/1sfvfss/anyone_have_insight_to_the_new_bsit_courses/" },
  { code: "D416", name: "DevNet Fundamentals", days: 84, url: "https://www.reddit.com/r/WGU/comments/1s6i578/d416_cisco_devnet_fundamentals/" },
  { code: "D829", name: "Digital Forensics in Cybersecurity", days: 1, url: "https://www.reddit.com/r/WGU/comments/1px7nhw/how_i_passed_d829_digital_forensics_in/" },
  { code: "D422", name: "Discrete Math: Algorithms and Cryptography", days: 7, url: "https://www.reddit.com/r/WGU/comments/17tdlek/d422_passed_what_to_expect/" },
  { code: "D421", name: "Discrete Math: Functions and Relations", days: 14, url: "https://www.reddit.com/r/WGU/comments/1axhyol/passed_discrete_math_functions_and_relations_d421/" },
  { code: "D420", name: "Discrete Math: Logic", days: 21, url: "https://www.reddit.com/r/WGU/comments/1phe1j5/d420_passed/" },
  { code: "C959", name: "Discrete Mathematics I", days: 20, url: "https://www.reddit.com/r/WGU_CompSci/comments/1kax6hg/c959_discrete_math_1_finished_in_20_days_no/" },
  { code: "C960", name: "Discrete Mathematics II", days: 7, url: "https://www.reddit.com/r/WGU_CompSci/comments/1lint0z/c960_discrete_math_ii_passed_2025_writeup_how_to/" },
  { code: "D333", name: "Ethics in Technology", days: 8, url: "https://www.reddit.com/r/WGU/comments/1fntvp5/summary_ethics_in_technology_d333_passed_in_8_days/" },
  { code: "E010", name: "Foundations of Programming (Python)", days: 21, url: "https://www.reddit.com/r/WGU/comments/1qmauq5/e010_foundations_of_programming_python_passed/" },
  { code: "D277", name: "Front-End Web Development", days: 2, url: "https://www.reddit.com/r/wgu_devs/comments/1eiiyfp/d277_finished/" },
  { code: "D430", name: "Fundamentals of Information Security", days: 28, url: "https://www.reddit.com/r/WGU/comments/1l0wxmc/i_passed_d430_fundamentals_of_information/" },
  { code: "D827", name: "Fundamentals of Information Security", days: 1, url: "https://www.reddit.com/r/WGU/comments/1pzlglm/d827_advice/" },
  { code: "D388", name: "Fundamentals of Spreadsheets and Data Presentations", days: 4, url: "https://www.reddit.com/r/WGU/comments/1kw8mhm/how_i_passed_d388_fundamentals_of_spreadsheets/" },
  { code: "D198", name: "Global Arts and Humanities", days: 1, url: "https://www.reddit.com/r/WGU/comments/wmswk5/global_arts_and_humanities_d198/" },
  { code: "E007", name: "Agile Methodology", url: "https://www.reddit.com/r/WGUIT/comments/1sfvfss/anyone_have_insight_to_the_new_bsit_courses/" },
  { code: "E005", name: "Business Productivity Software", days: 2, url: "https://www.reddit.com/r/WGUIT/comments/1sfvfss/anyone_have_insight_to_the_new_bsit_courses/" },
  { code: "E005", name: "Business Productivity Software", days: 2, url: "https://www.reddit.com/r/WGUIT/comments/1t7jbrk/business_productivity_software_e005/" },
  { code: "D386", name: "Hardware & Operating Systems Essentials", days: 7, url: "https://www.reddit.com/r/WGU/comments/1sqt4gz/passed_d386_first_try/" },
  { code: "C458", name: "Health, Fitness, and Wellness", days: 1, url: "https://www.reddit.com/r/WGU/comments/1iz3gv0/health_fitness_and_wellness_c458_passed_tips_guide/" },
  { code: "E028", name: "Hybrid Cloud Infrastructure and Orchestration", url: "https://www.reddit.com/r/WGU/comments/1rsdidy/e028_difficulty/" },
  { code: "D419", name: "Implementing and Administering Networking Solutions", days: 56, url: "https://www.reddit.com/r/WGU/comments/1pu69zt/passed_d419_ccna_certification/" },
  { code: "D246", name: "Influential Communication through Visual Design and Storytelling", days: 7, url: "https://www.reddit.com/r/WGU/comments/1d50kh8/d246_influential_communication_through_visual/" },
  { code: "C845", name: "Information Systems Security", days: 2, url: "https://www.reddit.com/r/WGU/comments/1mst8qv/information_systems_security_c845_passed/" },
  { code: "C165", name: "Integrated Physical Sciences", days: 10, url: "https://www.reddit.com/r/WGU/comments/1rawn38/passed_c165_integrated_physical_sciences_high/" },
  { code: "D337", name: "Internet of Things (IoT) and Infrastructure", days: 10, url: "https://www.reddit.com/r/WGU/comments/104eeyh/d337_internet_of_things_iot_and_infrastructure/" },
  { code: "D429", name: "Introduction to AI for Computer Scientists", days: 5, url: "https://www.reddit.com/r/WGU_CompSci/comments/1poo21n/d429_introduction_to_ai_for_computer_scientists/" },
  { code: "D491", name: "Introduction to Analytics", days: 5, url: "https://www.reddit.com/r/WGU/comments/1q98h00/passed_d491_introduction_to_analytics_oa/" },
  { code: "D268", name: "Introduction to Communication: Connecting with Others", days: 2, url: "https://www.reddit.com/r/WGU/comments/1ian7a8/passed_d268_in_two_days_in_my_mind/" },
  { code: "D684", name: "Introduction to Computer Science", days: 5, url: "https://www.reddit.com/r/WGU_CompSci/comments/1j4b1ky/passed_d684_intro_to_computer_science_in_5_days/" },
  { code: "D830", name: "Introduction to Cryptography", days: 3, url: "https://www.reddit.com/r/WGU/comments/1ggsu02/intro_to_cryptography_passed/" },
  { code: "D496", name: "Introduction to Data Science", days: 5, url: "https://www.reddit.com/r/WGU/comments/1ktutmu/course_one_of_the_bsda_nanodegree_completed496/" },
  { code: "D322", name: "Introduction to IT", days: 7, url: "https://www.reddit.com/r/WGU/comments/18enr2c/passed_d322_what_i_did_to_pass_and_helpful/" },
  { code: "E004", name: "Introduction to IT", days: 4, url: "https://www.reddit.com/r/WGU/comments/1orvtyd/introduction_to_it_e004_assessment_guardian/" },
  { code: "D199", name: "Introduction to Physical and Human Geography", days: 8, url: "https://www.reddit.com/r/WGU/comments/1dsj994/passed_d199_intro_to_physical_and_human_geography/" },
  { code: "D335", name: "Introduction to Programming in Python", days: 8, url: "https://www.reddit.com/r/WGU/comments/1rcns6r/d335_passed_in_8_days_no_coding_experience_tips/" },
  { code: "D372", name: "Introduction to Systems Thinking", days: 4, url: "https://www.reddit.com/r/WGU/comments/1efezq7/passed_systems_thinking_d372/" },
  { code: "D317", name: "IT Applications", days: 28, url: "https://www.reddit.com/r/WGU/comments/19cq2r2/passed_d317_it_applications_comptia_a_core_2/" },
  { code: "D316", name: "IT Foundations", days: 21, url: "https://www.reddit.com/r/WGU/comments/1py4cbn/d316_passed/" },
  { code: "D370", name: "IT Leadership Foundations", days: 2, url: "https://www.reddit.com/r/WGU/comments/1c4lncu/d370_it_leadership_foundations/" },
  { code: "D287", name: "Java Frameworks", days: 45, url: "https://www.reddit.com/r/WGU_CompSci/comments/15mocjz/d287_java_frameworks_ultimate_project_guide/" },
  { code: "D286", name: "Java Fundamentals", days: 30, url: "https://www.reddit.com/r/wgu_devs/comments/1sbs2yw/passed_java_fundamentals_d286/" },
  { code: "D280", name: "JavaScript Programming", days: 1, url: "https://www.reddit.com/r/wgu_devs/comments/1gl3mom/passed_d280_javascript_programming_in_3_hours/" },
  { code: "D828", name: "Legal Issues in Information Security", url: "https://www.reddit.com/r/WGUCyberSecurity/comments/1oovom2/d828_legal_issues_in_information_security/" },
  { code: "D281", name: "Linux Foundations", days: 14, url: "https://www.reddit.com/r/WGU/comments/1gqsuwx/passed_d281_linux_essentials_with_no_previous/" },
  { code: "D499", name: "Machine Learning", days: 32, url: "https://www.reddit.com/r/WGU/comments/1kh0w2r/d499_data_analytics_machine_learning/" },
  { code: "D501", name: "Machine Learning DevOps", days: 14, url: "https://www.reddit.com/r/WGUIT/comments/1g3oasr/machine_learning_devops_d501_need_help_for_first/" },
  { code: "D320", name: "Managing Cloud Security", days: 5, url: "https://www.reddit.com/r/WGU/comments/yv1qto/d320_c838_passed_in_5_days/" },
  { code: "D832", name: "Managing Information Security", days: 14, url: "https://www.reddit.com/r/WGUCyberSecurity/comments/1p54cww/d832/" },
  { code: "D308", name: "Mobile Application Development (Android)", days: 7, url: "https://www.reddit.com/r/WGU/comments/1krwabl/d308_passed_in_1_week_here_is_how/" },
  { code: "C971", name: "Mobile Application Development Using C#", days: 60, url: "https://www.reddit.com/r/wgu_devs/comments/wdvfc0/passed_c971_mobile_application_development_using_c/" },
  { code: "C683", name: "Natural Science Lab", days: 1, url: "https://www.reddit.com/r/WGU/comments/1apfm5r/i_passed_c683_in_a_day_super_easy_class_if_you/" },
  { code: "D412", name: "Network Analytics and Troubleshooting", days: 7, url: "https://www.reddit.com/r/WGU/comments/1iwl6v8/d412_network_analytics_and_troubleshooting_tips/" },
  { code: "D329", name: "Network and Security - Applications", days: 17, url: "https://www.reddit.com/r/WGU/comments/1isnsh0/i_passed_security_network_and_security/" },
  { code: "D315", name: "Network and Security - Foundations", days: 1, url: "https://www.reddit.com/r/WGU/comments/1kppp6e/how_i_passed_d315_network_and_security/" },
  { code: "D417", name: "Network Automation and Deployment", days: 2, url: "https://www.reddit.com/r/WGU/comments/1iiq242/d417_network_automation_passed_in_just_over_24/" },
  { code: "D325", name: "Networks", days: 7, url: "https://www.reddit.com/r/WGU/comments/1p5tzro/networksd325_passed/" },
  { code: "D686", name: "Operating Systems for Computer Scientists", days: 13, url: "https://www.reddit.com/r/WGU_CompSci/comments/1jektyk/d686_operating_systems_for_computer_scientist_oa/" },
  { code: "D332", name: "Penetration Testing and Vulnerability Analysis", days: 42, url: "https://www.reddit.com/r/WGUCyberSecurity/comments/1k9z1eo/penetration_testing_and_vulnerability_analysis/" },
  { code: "D685", name: "Practical Applications of Prompt", days: 1, url: "https://www.reddit.com/r/WGU_CompSci/comments/1imkzu5/passed_my_first_wgu_course_practical_applications/" },
  { code: "D522", name: "Python for IT Automation", days: 21, url: "https://www.reddit.com/r/WGU/comments/1g85w8d/d522_python_for_it_automation_passed_first_attempt/" },
  { code: "C867", name: "Scripting and Programming - Applications", days: 8, url: "https://www.reddit.com/r/WGU_CompSci/comments/1h4lkn6/passed_c867_in_8_days/" },
  { code: "D493", name: "Scripting and Programming - Applications", days: 14, url: "https://www.reddit.com/r/WGU/comments/1i5u6fg/d493_scripting_and_programming_applications/" },
  { code: "D278", name: "Scripting and Programming - Foundations", days: 7, url: "https://www.reddit.com/r/WGU/comments/1mxfkex/d278_scripting_and_programming_foundations_passed/" },
  { code: "D415", name: "Software Defined Networking", days: 10, url: "https://www.reddit.com/r/WGU/comments/18o64hj/software_defined_networking_d415_passed_and_now/" },
  { code: "D480", name: "Software Design & Quality Assurance", days: 10, url: "https://www.reddit.com/r/WGU/comments/1hwsctq/d480_passed_quickly_here_is_how/" },
  { code: "D284", name: "Software Engineering", days: 1, url: "https://www.reddit.com/r/wgu_devs/comments/187y8in/i_passed_d284_software_engineering/" },
  { code: "D424", name: "Software Engineering Capstone", days: 21, url: "https://www.reddit.com/r/WGU/comments/1efdfd7/i_passed_d424_swe_capstone_tips/" },
  { code: "C968", name: "Software I – C#", days: 1, url: "https://www.reddit.com/r/WGU/comments/1gzmzgj/c968_software_i_done/" },
  { code: "C969", name: "Software II – Advanced C#", days: 5, url: "https://www.reddit.com/r/WGU/comments/dw3kxx/software_ii_advanced_c_c969_passed/" },
  { code: "D385", name: "Software Security & Testing", days: 10, url: "https://www.reddit.com/r/WGU/comments/1kfg3bs/d385_software_security_and_testing_passed_10_days/" },
  { code: "D339", name: "Technical Communication", days: 5, url: "https://www.reddit.com/r/WGU/comments/11qc56n/d339technical_communication/" },
  { code: "D773", name: "Technology and Ethics: Emerging Trends and Society", days: 2, url: "https://www.reddit.com/r/WGU/comments/1l7fteu/d773_technology_and_ethics_for_the_education/" },
  { code: "D413", name: "Telecomm and Wireless Communications", days: 14, url: "https://www.reddit.com/r/WGU/comments/1ner75n/d413_passed_in_2_weeks/" },
  { code: "E008", name: "Technology Management", url: "https://www.reddit.com/r/WGUIT/comments/1sfvfss/anyone_have_insight_to_the_new_bsit_courses/" },
  { code: "D267", name: "US History: Stories of American Democracy", days: 3, url: "https://www.reddit.com/r/WGU/comments/1t04f4e/how_to_pass_d267/" },
  { code: "D479", name: "User Experience Design", days: 2, url: "https://www.reddit.com/r/wgu_devs/comments/1riyuwn/user_experience_design_d479_confused_by_feedback/" },
  { code: "D279", name: "User Interface Design", days: 1, url: "https://www.reddit.com/r/WGU/comments/1707pvp/passed_user_interface_design_d279/" },
  { code: "D197", name: "Version Control", days: 3, url: "https://www.reddit.com/r/WGU/comments/1c3hdel/passed_d197_first_attempt/" },
  { code: "E027", name: "Virtualization and IaaS", url: "https://www.reddit.com/r/WGU/comments/1rp8zth/e027_task_2_tip_of_the_day/" },
  { code: "D276", name: "Web Development Foundations", days: 5, url: "https://www.reddit.com/r/WGU/comments/1g5jb1j/passed_d276_web_development_fundamentals_in_5_days/" },
];
