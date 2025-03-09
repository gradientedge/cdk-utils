import { IAspect } from 'cdktf'
import { IConstruct } from 'constructs'

type TaggableConstruct = IConstruct & {
  tags?: { [key: string]: string }
  tagsInput?: { [key: string]: string }
}

function isTaggableConstruct(defaultTags: IConstruct): defaultTags is TaggableConstruct {
  return 'tags' in defaultTags && 'tagsInput' in defaultTags
}

export class TagsAddingAspect implements IAspect {
  constructor(private tagsToAdd: Record<string, string>) {}

  // This method is called on every Construct within the specified scope (resources, data sources, etc.).
  visit(node: IConstruct) {
    if (isTaggableConstruct(node)) {
      // We need to take the input value to not create a circular reference
      const currentTags = node.tagsInput || {}
      node.tags = { ...this.tagsToAdd, ...currentTags }
    }
  }
}
