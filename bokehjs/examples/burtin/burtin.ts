namespace Burtin {
  import plt = Bokeh.Plotting;
  const {range, values} = Bokeh.LinAlg;

  import Color = Bokeh.Color;
  import Map = Bokeh.Map;

  console.log(`Bokeh ${Bokeh.version}`);
  Bokeh.set_log_level("info");
  Bokeh.settings.dev = true

  type Gram = "negative" | "positive";

  const antibiotics: [string, number, number, number, Gram][] = [
    ["Mycobacterium tuberculosis",      800,        5,            2,        "negative"],
    ["Salmonella schottmuelleri",       10,         0.8,          0.09,     "negative"],
    ["Proteus vulgaris",                3,          0.1,          0.1,      "negative"],
    ["Klebsiella pneumoniae",           850,        1.2,          1,        "negative"],
    ["Brucella abortus",                1,          2,            0.02,     "negative"],
    ["Pseudomonas aeruginosa",          850,        2,            0.4,      "negative"],
    ["Escherichia coli",                100,        0.4,          0.1,      "negative"],
    ["Salmonella (Eberthella) typhosa", 1,          0.4,          0.008,    "negative"],
    ["Aerobacter aerogenes",            870,        1,            1.6,      "negative"],
    ["Brucella antracis",               0.001,      0.01,         0.007,    "positive"],
    ["Streptococcus fecalis",           1,          1,            0.1,      "positive"],
    ["Staphylococcus aureus",           0.03,       0.03,         0.001,    "positive"],
    ["Staphylococcus albus",            0.007,      0.1,          0.001,    "positive"],
    ["Streptococcus hemolyticus",       0.001,      14,           10,       "positive"],
    ["Streptococcus viridans",          0.005,      10,           40,       "positive"],
    ["Diplococcus pneumoniae",          0.005,      11,           10,       "positive"],
  ]

  interface Antibiotics {
    index:        number[];
    length:       number;

    bacteria:     string[];
    penicillin:   number[];
    streptomycin: number[];
    neomycin:     number[];
    gram:         Gram[];
  }

  const df: Antibiotics = {
    index:        antibiotics.map((_, i) => i),
    length:       antibiotics.length,

    bacteria:     antibiotics.map((row) => row[0]),
    penicillin:   antibiotics.map((row) => row[1]),
    streptomycin: antibiotics.map((row) => row[2]),
    neomycin:     antibiotics.map((row) => row[3]),
    gram:         antibiotics.map((row) => row[4]),
  }

  const drug_color: Map<Color> = {
    Penicillin:   "#0d3362",
    Streptomycin: "#c64737",
    Neomycin:     "black"  ,
  }

  const gram_color: Map<Color> = {
    positive: "#aeaeb8",
    negative: "#e69584",
  }

  const width = 800
  const height = 800
  const inner_radius = 90
  const outer_radius = 300 - 10

  const minr = Math.sqrt(Math.log(.001 * 1E4))
  const maxr = Math.sqrt(Math.log(1000 * 1E4))
  const a = (outer_radius - inner_radius) / (minr - maxr)
  const b = inner_radius - a * maxr

  function rad(mic: number[]): number[] {
    return mic.map((v) => a * Math.sqrt(Math.log(v * 1E4)) + b)
  }

  const big_angle = 2.0 * Math.PI / (df.length + 1)
  const small_angle = big_angle / 7

  const p = plt.figure({
    title: null,
    plot_width: width, plot_height: height,
    x_axis_type: null, y_axis_type: null,
    x_range: [-420, 420], y_range: [-420, 420],
    min_border: 0,
    outline_line_color: "black",
    background_fill_color: "#f0e1d2",
  })

  // annular wedges
  const angles = df.index.map((i) => Math.PI/2 - big_angle/2 - i*big_angle)
  const colors = df.gram.map((gram) => gram_color[gram])
  p.annular_wedge(0, 0, inner_radius, outer_radius, angles.map((angle) => -big_angle + angle), angles, {color: colors})

  // small wedges
  p.annular_wedge(0, 0, inner_radius, rad(df.penicillin),
          angles.map((angle) => -big_angle+angle+5*small_angle),
          angles.map((angle) => -big_angle+angle+6*small_angle),
          {color: drug_color['Penicillin']})
  p.annular_wedge(0, 0, inner_radius, rad(df.streptomycin),
          angles.map((angle) => -big_angle+angle+3*small_angle),
          angles.map((angle) => -big_angle+angle+4*small_angle),
          {color: drug_color['Streptomycin']})
  p.annular_wedge(0, 0, inner_radius, rad(df.neomycin),
          angles.map((angle) => -big_angle+angle+1*small_angle),
          angles.map((angle) => -big_angle+angle+2*small_angle),
          {color: drug_color['Neomycin']})

  // circular axes and lables
  const labels = range(-3, 4).map((v) => 10**v)
  const radii = labels.map((label) => a * Math.sqrt(Math.log(label * 1E4)) + b)

  p.circle(0, 0, {radius: radii, fill_color: null, line_color: "white"})
  p.text(0, radii.slice(0, -1), labels.slice(0, -1).map((label) => label.toString()),
     {text_font_size: "8pt", text_align: "center", text_baseline: "middle"})

  // radial axes
  p.annular_wedge(0, 0, inner_radius-10, outer_radius+10,
          angles.map((angle) => -big_angle+angle),
          angles.map((angle) => -big_angle+angle),
          {color: "black"})

  // bacteria labels
  const xr = angles.map((angle) => radii[0]*Math.cos(-big_angle/2 + angle))
  const yr = angles.map((angle) => radii[0]*Math.sin(-big_angle/2 + angle))
  const label_angle = angles.map((angle) => -big_angle/2 + angle)
               .map((angle) => (angle < -Math.PI/2) ? angle + Math.PI : angle)
  p.text(xr, yr, df.bacteria, {angle: label_angle,
     text_font_size: "9pt", text_align: "center", text_baseline: "middle"})

  // OK, these hand drawn legends are pretty clunky, will be improved in future release
  p.circle([-40, -40], [-370, -390], {color: values(gram_color), radius: 5})
  p.text([-30, -30], [-370, -390], Object.keys(gram_color).map((gram) => `Gram-${gram}`),
     {text_font_size: "7pt", text_align: "left", text_baseline: "middle"})

  p.rect([-40, -40, -40], [18, 0, -18], 30, 13, {color: values(drug_color)})
  p.text([-15, -15, -15], [18, 0, -18], Object.keys(drug_color),
     {text_font_size: "9pt", text_align: "left", text_baseline: "middle"})

  plt.show(p)
}
