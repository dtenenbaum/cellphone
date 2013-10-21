require 'nokogiri'
require 'pp'
require "json"


f = File.open("cellphone.graphml")
doc = Nokogiri::XML(f)
f.close

doc.remove_namespaces!

nodes = doc.xpath("//node")
edges = doc.xpath("//edge")

onodes = []
oedges = []


nodes.each do |node|
    h = {}
    h["id"] = node.attribute("id").value
    nodes.children.each do |child|
        next if child.class == Nokogiri::XML::Text
        key = child.attribute("key").value
        value = child.children.first.to_s
        value = false if value == "false"
        value = true if value == "true"
        h[key] = value
    end
    onodes.push h
end

#pp onodes

edges.each do |edge|
    h = {}
    h["source"] = edge.attribute("source").value
    h["target"] = edge.attribute("target").value
    oedges.push h
end

#pp oedges

lines = File.readlines("cellphone.gml")

label = "nothing"

pos = {}

for line in lines
    line.strip!
    if line =~ /^label/
        #h = {}
        dim = {}
        label = line.split("\t").last.gsub(/"/, "")
        #h["id"] = label
    elsif line =~ /^x\t/
        dim["x"] = line.split("\t").last.to_f
    elsif line =~ /^y\t/
        dim["y"] = line.split("\t").last.to_f
        pos[label] = dim
    end
end

#pp pos

def wrap(x)
    {"data" => x}
end


elements = {}
elements["nodes"] = onodes.map{|i| wrap(i)}
elements["edges"] = oedges.map{|i| wrap(i)}

root = {}
root["elements"] = elements
root["positions"] = pos

#pp 

#pp oedges.map{|i| wrap(i)}

#pp pos.map{|i| wrap(i)}


#puts JSON.pretty_generate(root)
puts JSON.pretty_generate(root)


